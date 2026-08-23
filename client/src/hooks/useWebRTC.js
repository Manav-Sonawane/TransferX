import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socket.service';

const CHUNK_SIZE = 16384; // 16KB per chunk

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export const useWebRTC = (sessionCode, myName) => {
  const [peerName, setPeerName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('waiting'); // waiting, connecting, connected, disconnected
  const [transferProgress, setTransferProgress] = useState(null); // { fileName, progress, direction: 'sending' | 'receiving' }
  const [receivedFiles, setReceivedFiles] = useState([]);

  const peerConnection = useRef(null);
  const dataChannel = useRef(null);
  const socket = useRef(null);

  // Buffer for receiving files
  const receiveBuffer = useRef([]);
  const receivedSize = useRef(0);
  const incomingFileInfo = useRef(null); // { name, size, type }

  const targetSocketId = useRef(null);
  const [activeSessionCode, setActiveSessionCode] = useState(sessionCode !== 'new' ? sessionCode : null);
  const activeSessionCodeRef = useRef(sessionCode !== 'new' ? sessionCode : null);
  
  const iceCandidateQueue = useRef([]);
  const lastProgress = useRef(-1);

  useEffect(() => {
    let isMounted = true;
    socket.current = socketService.connect();

    // 1. Create or Join session
    if (sessionCode === 'new') {
      socket.current.emit('create-session', { name: myName }, (response) => {
        if (!isMounted) return;
        if (response.error) {
          console.error('[WebRTC]', response.error);
          setConnectionStatus('error');
          return;
        }
        setActiveSessionCode(response.session.sessionCode);
        activeSessionCodeRef.current = response.session.sessionCode;
        setConnectionStatus('waiting');
      });
    } else {
      socket.current.emit('join-session', { sessionCode, name: myName }, (response) => {
        if (!isMounted) return;
        if (response.error) {
          console.error('[WebRTC]', response.error);
          setConnectionStatus('error');
          return;
        }

        setActiveSessionCode(response.session.sessionCode);
        activeSessionCodeRef.current = response.session.sessionCode;
        
        const { session } = response;
        const otherPeer = session.participants.find(p => p.socketId !== socket.current.id);
        if (otherPeer) {
          targetSocketId.current = otherPeer.socketId;
          setPeerName(otherPeer.name);
          initiateConnection();
        }
      });
    }

    const onPeerJoined = (participant) => {
      console.log(`[WebRTC] Peer joined: ${participant.name} (${participant.socketId})`);
      targetSocketId.current = participant.socketId;
      setPeerName(participant.name);
      setConnectionStatus('connecting');
    };

    const onPeerLeft = () => {
      console.log(`[WebRTC] Peer left`);
      setPeerName(null);
      setConnectionStatus('disconnected');
      targetSocketId.current = null;
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      dataChannel.current = null;
    };

    const onWebRTCOffer = async ({ senderSocketId, offer }) => {
      console.log(`[WebRTC] Received offer from ${senderSocketId}`);
      targetSocketId.current = senderSocketId;
      await handleReceiveOffer(offer);
    };

    const onWebRTCAnswer = async ({ senderSocketId, answer }) => {
      console.log(`[WebRTC] Received answer from ${senderSocketId}`);
      await handleReceiveAnswer(answer);
    };

    const onWebRTCIceCandidate = async ({ senderSocketId, candidate }) => {
      // console.log(`[WebRTC] Received ICE candidate`); // Keeping this brief to avoid log spam
      await handleNewICECandidate(candidate);
    };

    socket.current.on('peer-joined', onPeerJoined);
    socket.current.on('peer-left', onPeerLeft);
    socket.current.on('webrtc-offer', onWebRTCOffer);
    socket.current.on('webrtc-answer', onWebRTCAnswer);
    socket.current.on('webrtc-ice-candidate', onWebRTCIceCandidate);

    const handleBeforeUnload = () => {
      socket.current.emit('leave-session');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socket.current.emit('leave-session');
      socket.current.off('peer-joined', onPeerJoined);
      socket.current.off('peer-left', onPeerLeft);
      socket.current.off('webrtc-offer', onWebRTCOffer);
      socket.current.off('webrtc-answer', onWebRTCAnswer);
      socket.current.off('webrtc-ice-candidate', onWebRTCIceCandidate);
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    };
  }, [sessionCode, myName]);


  const createPeerConnection = () => {
    if (peerConnection.current) return;

    console.log(`[WebRTC] Creating new RTCPeerConnection`);
    peerConnection.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && targetSocketId.current) {
        socket.current.emit('webrtc-ice-candidate', {
          targetSocketId: targetSocketId.current,
          candidate: event.candidate,
          sessionCode: activeSessionCodeRef.current
        });
      }
    };

    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      console.log(`[WebRTC] Connection state changed to: ${state}`);
      if (state === 'connected') {
        setConnectionStatus('connected');
      } else if (state === 'failed' || state === 'closed') {
        setConnectionStatus('disconnected');
        if (peerConnection.current) {
          peerConnection.current.close();
          peerConnection.current = null;
        }
        dataChannel.current = null;
      } else if (state === 'disconnected') {
        // Don't close immediately on 'disconnected' — WebRTC may recover
        setConnectionStatus('connecting');
      } else {
        setConnectionStatus('connecting');
      }
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      const iceState = peerConnection.current?.iceConnectionState;
      console.log(`[WebRTC] ICE connection state: ${iceState}`);
      if (iceState === 'failed') {
        console.warn('[WebRTC] ICE failed — attempting restart');
        peerConnection.current?.restartIce();
      }
    };

    peerConnection.current.onicegatheringstatechange = () => {
      console.log(`[WebRTC] ICE gathering state: ${peerConnection.current?.iceGatheringState}`);
    };

    peerConnection.current.onsignalingstatechange = () => {
      console.log(`[WebRTC] Signaling state changed to: ${peerConnection.current?.signalingState}`);
    };

    peerConnection.current.ondatachannel = (event) => {
      console.log(`[WebRTC] Data channel received via ondatachannel`);
      dataChannel.current = event.channel;
      setupDataChannel();
    };
  };

  const setupDataChannel = () => {
    if (!dataChannel.current) return;

    dataChannel.current.binaryType = 'arraybuffer';

    dataChannel.current.onopen = () => {
      console.log('[WebRTC] Data channel readyState: open');
    };

    dataChannel.current.onclose = () => {
      console.log('[WebRTC] Data channel readyState: closed');
    };

    dataChannel.current.onmessage = (event) => {
      // Receiving metadata
      if (typeof event.data === 'string') {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch (e) {
          console.error('[WebRTC] Error parsing JSON from data channel', e);
          return;
        }

        if (message.type === 'file-start') {
          // Guard against null objects causing crashes
          const fileName = message.file?.name || 'Unknown File';
          const fileSize = message.file?.size || 0;
          const fileType = message.file?.type || 'application/octet-stream';

          incomingFileInfo.current = { name: fileName, size: fileSize, type: fileType };
          receiveBuffer.current = [];
          receivedSize.current = 0;
          lastProgress.current = 0;
          setTransferProgress({ fileName, progress: 0, direction: 'receiving' });
        } else if (message.type === 'file-end') {
          // Reassemble file
          if (!incomingFileInfo.current) return;

          const blob = new Blob(receiveBuffer.current, { type: incomingFileInfo.current.type });
          const url = URL.createObjectURL(blob);
          
          const { name, size } = incomingFileInfo.current;
          
          setReceivedFiles(prev => [...prev, {
            name,
            size,
            url
          }]);
          
          setTransferProgress(null);
          receiveBuffer.current = [];
          receivedSize.current = 0;
          incomingFileInfo.current = null;
        }
      } 
      // Receiving chunks
      else if (event.data instanceof ArrayBuffer) {
        receiveBuffer.current.push(event.data);
        receivedSize.current += event.data.byteLength;
        
        if (incomingFileInfo.current) {
          const progress = Math.round((receivedSize.current / incomingFileInfo.current.size) * 100);
          // Throttle updates: only update if progress increased by at least 1% or is 100%
          if (progress > lastProgress.current || progress === 100) {
            lastProgress.current = progress;
            setTransferProgress(prev => prev ? { ...prev, progress } : null);
          }
        }
      }
    };
  };

  const processIceQueue = async () => {
    if (peerConnection.current && peerConnection.current.remoteDescription) {
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error(`[WebRTC] Error adding queued ICE candidate:`, e);
        }
      }
    }
  };

  const initiateConnection = async () => {
    console.log(`[WebRTC] Initiating connection (creating offer)`);
    createPeerConnection();
    
    // We create the data channel since we are the offerer
    dataChannel.current = peerConnection.current.createDataChannel('fileTransfer');
    setupDataChannel();

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log(`[WebRTC] Offer created and set as local description`);

      socket.current.emit('webrtc-offer', {
        targetSocketId: targetSocketId.current,
        offer,
        sessionCode: activeSessionCodeRef.current
      });
    } catch (e) {
      console.error(`[WebRTC] Error creating offer:`, e);
    }
  };

  const handleReceiveOffer = async (offer) => {
    createPeerConnection();
    
    if (peerConnection.current.signalingState !== 'stable') {
      console.warn(`[WebRTC] Ignoring offer in state: ${peerConnection.current.signalingState}`);
      return;
    }

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log(`[WebRTC] Remote description set (offer)`);
      
      await processIceQueue();
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log(`[WebRTC] Answer created and set as local description`);

      socket.current.emit('webrtc-answer', {
        targetSocketId: targetSocketId.current,
        answer,
        sessionCode: activeSessionCodeRef.current
      });
    } catch (e) {
      console.error(`[WebRTC] Error handling offer:`, e);
    }
  };

  const handleReceiveAnswer = async (answer) => {
    if (!peerConnection.current) return;

    if (peerConnection.current.signalingState !== 'have-local-offer') {
      console.warn(`[WebRTC] Ignoring answer in state: ${peerConnection.current.signalingState}`);
      return;
    }

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`[WebRTC] Remote description set (answer)`);
      
      await processIceQueue();
    } catch (e) {
      console.error(`[WebRTC] Error handling answer:`, e);
    }
  };

  const handleNewICECandidate = async (candidate) => {
    if (!peerConnection.current) return;

    if (!peerConnection.current.remoteDescription) {
      // console.log(`[WebRTC] Queueing ICE candidate (remoteDescription not set)`);
      iceCandidateQueue.current.push(candidate);
      return;
    }

    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error(`[WebRTC] Error adding ICE candidate:`, e);
    }
  };

  const sendFile = useCallback((file) => {
    if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
      console.error('[WebRTC] Data channel not open');
      return;
    }

    setTransferProgress({ fileName: file.name, progress: 0, direction: 'sending' });

    // Send metadata
    dataChannel.current.send(JSON.stringify({
      type: 'file-start',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    }));

    let offset = 0;
    const highWaterMark = 1048576; // 1MB

    // Configure the low threshold for the data channel to trigger the event when the buffer drains
    dataChannel.current.bufferedAmountLowThreshold = 16384; 
    lastProgress.current = 0;

    const readSlice = (currentOffset) => {
      const slice = file.slice(currentOffset, currentOffset + CHUNK_SIZE);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // Send the chunk
        dataChannel.current.send(e.target.result);
        offset += e.target.result.byteLength;
        
        // Update progress safely
        const progress = Math.round((offset / file.size) * 100);
        if (progress > lastProgress.current || progress === 100) {
          lastProgress.current = progress;
          setTransferProgress(prev => prev ? { ...prev, progress } : null);
        }

        if (offset < file.size) {
          // Check if buffer is getting full
          if (dataChannel.current.bufferedAmount > highWaterMark) {
            // Wait for buffer to drain before sending more
            const onDrain = () => {
              dataChannel.current.removeEventListener('bufferedamountlow', onDrain);
              readSlice(offset);
            };
            dataChannel.current.addEventListener('bufferedamountlow', onDrain);
          } else {
            // Continue immediately if buffer is fine
            readSlice(offset);
          }
        } else {
          // File complete
          dataChannel.current.send(JSON.stringify({ type: 'file-end' }));
          setTimeout(() => setTransferProgress(null), 1000); 
        }
      };
      
      reader.readAsArrayBuffer(slice);
    };

    readSlice(0);
  }, []);

  return {
    activeSessionCode,
    peerName,
    connectionStatus,
    transferProgress,
    receivedFiles,
    sendFile
  };
};
