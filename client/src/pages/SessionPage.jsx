import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '../hooks/useWebRTC';
import { useDropzone } from 'react-dropzone';
import { 
  Users, UserPlus, FileUp, FileDown, ShieldCheck, 
  XCircle, Copy, Check, UploadCloud, Smartphone, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const SessionPage = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  
  // Generating a random username for the session
  const [myName] = useState(() => `User_${Math.floor(Math.random() * 10000)}`);
  const [copied, setCopied] = useState(false);

  const {
    activeSessionCode,
    peerName,
    connectionStatus,
    transferProgress,
    receivedFiles,
    sendFile
  } = useWebRTC(sessionCode, myName);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (connectionStatus !== 'connected') {
        toast.error('Waiting for peer to connect before sending files.');
        return;
      }
      
      if (acceptedFiles.length > 0) {
        // Send the first file (MVP handles one at a time sequentially)
        sendFile(acceptedFiles[0]);
      }
    },
    [connectionStatus, sendFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const copyCode = () => {
    if (!activeSessionCode) return;
    navigator.clipboard.writeText(activeSessionCode);
    setCopied(true);
    toast.success('Session code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveSession = () => {
    // The hook cleans up on unmount
    navigate('/p2p');
  };

  // Helper to format bytes
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col p-4 md:p-8">
      
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-surface-900/60 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-surface-800">
          <div className="flex items-center gap-4">
            <button 
              onClick={leaveSession}
              className="p-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                P2P Session
                {connectionStatus === 'connected' ? (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-success-500 animate-pulse"></span>
                ) : (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-warning-500"></span>
                )}
              </h1>
              <p className="text-sm text-surface-400">
                {connectionStatus === 'connected' ? 'Securely connected via WebRTC' : 'Waiting for connection...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-surface-400 bg-surface-800/50 px-4 py-2 rounded-xl">
              <ShieldCheck size={16} className="text-success-500" />
              End-to-End Encrypted
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          
          {/* Left Column: Peers & Info */}
          <div className="space-y-6">
            
            {/* Session Code Card */}
            <div className="card p-6 border-surface-800 bg-surface-900/60">
              <h3 className="text-sm font-semibold text-surface-400 mb-4 uppercase tracking-wider">Session Code</h3>
              
              <div className="flex items-center justify-between bg-surface-950 border border-surface-800 rounded-xl p-4">
                <span className="text-3xl font-bold tracking-widest font-heading text-white">
                  {activeSessionCode || '.....'}
                </span>
                <button 
                  onClick={copyCode}
                  className="p-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={20} className="text-success-500" /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-xs text-surface-500 mt-4 text-center">
                Share this code with the receiver to connect.
              </p>
            </div>

            {/* Participants Card */}
            <div className="card p-6 border-surface-800 bg-surface-900/60 flex-1">
              <h3 className="text-sm font-semibold text-surface-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} />
                Participants
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{myName} (You)</p>
                    <p className="text-xs text-success-500">Online</p>
                  </div>
                </div>

                {peerName ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                    <div className="w-10 h-10 rounded-full bg-secondary-500/20 text-secondary-400 flex items-center justify-center">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{peerName}</p>
                      <p className="text-xs text-success-500 capitalize">{connectionStatus}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 p-4 rounded-xl border border-dashed border-surface-700 text-surface-500 text-sm">
                    <UserPlus size={18} />
                    Waiting for peer...
                  </div>
                )}
              </div>
            </div>
            
          </div>

          {/* Right Column: Transfer Area */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Active Transfer (Progress) */}
            {transferProgress && (
              <div className="card p-6 border-primary-500/30 bg-primary-500/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${transferProgress.direction === 'sending' ? 'bg-primary-500/20 text-primary-400' : 'bg-secondary-500/20 text-secondary-400'}`}>
                      {transferProgress.direction === 'sending' ? <FileUp size={20} /> : <FileDown size={20} />}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{transferProgress.direction === 'sending' ? 'Sending' : 'Receiving'}</h4>
                      <p className="text-sm text-surface-400 truncate max-w-[200px] sm:max-w-[300px]">{transferProgress.fileName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-heading text-white">{transferProgress.progress}%</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ease-out ${transferProgress.direction === 'sending' ? 'bg-primary-500' : 'bg-secondary-500'}`}
                    style={{ width: `${transferProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Dropzone */}
            <div 
              {...getRootProps()} 
              className={`card flex-1 min-h-[300px] border-2 border-dashed flex flex-col items-center justify-center p-8 transition-colors text-center ${
                connectionStatus !== 'connected' 
                  ? 'border-surface-800 bg-surface-900/30 opacity-50 cursor-not-allowed'
                  : isDragActive 
                    ? 'border-primary-500 bg-primary-500/5 cursor-copy' 
                    : 'border-surface-700 bg-surface-900/60 hover:border-primary-500/50 hover:bg-surface-800/50 cursor-pointer'
              }`}
            >
              <input {...getInputProps()} disabled={connectionStatus !== 'connected'} />
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ${
                connectionStatus === 'connected' ? 'bg-gradient-brand shadow-glow-blue' : 'bg-surface-800'
              }`}>
                <UploadCloud size={32} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-heading font-bold text-white mb-2">
                {connectionStatus !== 'connected' ? 'Waiting for connection...' : 'Drag & Drop files here'}
              </h3>
              <p className="text-surface-400 max-w-sm">
                {connectionStatus !== 'connected' 
                  ? 'You can select files once a peer joins the session.' 
                  : 'Or click to browse your files. Files transfer instantly to the connected peer.'}
              </p>
            </div>

            {/* Received Files List */}
            {receivedFiles.length > 0 && (
              <div className="card p-6 border-surface-800 bg-surface-900/60">
                <h3 className="text-sm font-semibold text-surface-400 mb-4 uppercase tracking-wider">Received Files</h3>
                <div className="space-y-3">
                  {receivedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-secondary-500/50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded-lg bg-secondary-500/20 text-secondary-400 flex-shrink-0">
                          <FileDown size={20} />
                        </div>
                        <div className="truncate">
                          <p className="text-white font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-surface-400">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <a 
                        href={file.url} 
                        download={file.name}
                        className="btn-secondary py-1.5 px-4 text-xs flex-shrink-0"
                      >
                        Save
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPage;
