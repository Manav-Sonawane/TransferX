import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '../hooks/useWebRTC';
import { Users, UserPlus, FileUp, FileDown, ShieldCheck, Copy, Check, Smartphone, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import NBCard from '../components/ui/NBCard';
import NBButton from '../components/ui/NBButton';
import NBBadge from '../components/ui/NBBadge';
import NBProgress from '../components/ui/NBProgress';
import NBDropzone from '../components/ui/NBDropzone';

const SessionPage = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [myName] = useState(() => `User_${Math.floor(Math.random() * 10000)}`);
  const [copied, setCopied] = useState(false);

  const { activeSessionCode, peerName, connectionStatus, transferProgress, receivedFiles, sendFile } = useWebRTC(sessionCode, myName);

  const onFileAccepted = useCallback((file) => {
    if (connectionStatus !== 'connected') {
      toast.error('Waiting for peer to connect before sending files.');
      return;
    }
    sendFile(file);
  }, [connectionStatus, sendFile]);

  const copyCode = () => {
    if (!activeSessionCode) return;
    navigator.clipboard.writeText(activeSessionCode);
    setCopied(true);
    toast.success('Session code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveSession = () => navigate('/');

  const formatBytes = (bytes, d = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${s[i]}`;
  };

  const isConnected = connectionStatus === 'connected';

  return (
    <div className="nb-page" style={{ minHeight: '100vh' }}>

      {/* ─── Header bar ─── */}
      <header style={{ borderBottom: 'var(--nb-border)', background: 'white' }} className="sticky top-0 z-50">
        <div className="nb-container flex items-center justify-between h-14">

          {/* Left: back + title */}
          <div className="flex items-center gap-3">
            <NBButton variant="ghost" size="sm" onClick={leaveSession} aria-label="Leave session">
              <ArrowLeft size={15} />
            </NBButton>
            <div>
              <h1 className="font-bold uppercase tracking-wider text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                P2P Session
              </h1>
              <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
                {isConnected ? 'WebRTC connected' : 'Waiting for peer...'}
              </p>
            </div>
          </div>

          {/* Right: status badge */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <NBBadge color="green">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
                Connected
              </NBBadge>
            ) : (
              <NBBadge color="orange">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                Waiting
              </NBBadge>
            )}
            <div className="hidden sm:flex items-center gap-1.5">
              <ShieldCheck size={14} style={{ color: 'var(--nb-green)' }} />
              <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>E2E Encrypted</span>
            </div>
          </div>
        </div>
      </header>

      <div className="nb-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── Left column ─── */}
          <div className="flex flex-col gap-6">

            {/* Session Code */}
            <NBCard>
              <div className="nb-card-header-black">
                <span className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-mono)' }}>Session Code</span>
              </div>
              <div className="p-5">
                <div
                  className="flex items-center justify-between p-4 mb-3"
                  style={{ border: 'var(--nb-border)', background: 'var(--nb-gray)' }}
                >
                  <span
                    className="text-3xl font-bold tracking-[0.4em] select-all"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {activeSessionCode || '·····'}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2 hover:bg-gray-200 transition-colors"
                    aria-label="Copy session code"
                    style={{ border: '2px solid var(--nb-black)' }}
                  >
                    {copied
                      ? <Check size={18} style={{ color: 'var(--nb-green)' }} />
                      : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-center" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
                  Share this code with the receiver to connect.
                </p>
              </div>
            </NBCard>

            {/* Participants */}
            <NBCard className="flex-1">
              <div className="nb-card-header-white">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Participants</span>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {/* Me */}
                <div className="flex items-center gap-3 p-3" style={{ border: 'var(--nb-border-thin)', background: 'var(--nb-gray)' }}>
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nb-blue)', border: '2px solid var(--nb-black)' }}>
                    <Smartphone size={16} color="white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{myName} <span style={{ color: '#6b7280' }}>(You)</span></p>
                    <NBBadge color="green" className="mt-1">Online</NBBadge>
                  </div>
                </div>

                {/* Peer */}
                {peerName ? (
                  <div className="flex items-center gap-3 p-3" style={{ border: 'var(--nb-border-thin)', background: 'var(--nb-gray)' }}>
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nb-lavender)', border: '2px solid var(--nb-black)' }}>
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{peerName}</p>
                      <NBBadge color={isConnected ? 'green' : 'orange'} className="mt-1 capitalize">{connectionStatus}</NBBadge>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 p-4" style={{ border: '2px dashed var(--nb-black)', color: '#6b7280' }}>
                    <UserPlus size={16} />
                    <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>Waiting for peer...</span>
                  </div>
                )}
              </div>
            </NBCard>

          </div>

          {/* ─── Right column ─── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Transfer Progress */}
            {transferProgress && (
              <NBCard>
                <div className={`nb-card-header-${transferProgress.direction === 'sending' ? 'blue' : 'lavender'}`}>
                  <div className="flex items-center gap-2">
                    {transferProgress.direction === 'sending'
                      ? <FileUp size={14} color="white" />
                      : <FileDown size={14} />}
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ fontFamily: 'var(--font-mono)', color: transferProgress.direction === 'sending' ? 'white' : 'var(--nb-black)' }}
                    >
                      {transferProgress.direction === 'sending' ? 'Sending' : 'Receiving'}
                    </span>
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ fontFamily: 'var(--font-mono)', color: transferProgress.direction === 'sending' ? 'white' : 'var(--nb-black)' }}
                  >
                    {transferProgress.progress}%
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs mb-3 truncate" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
                    {transferProgress.fileName}
                  </p>
                  <NBProgress
                    progress={transferProgress.progress}
                    accent={transferProgress.direction === 'sending' ? 'blue' : 'black'}
                    showPercent={false}
                  />
                </div>
              </NBCard>
            )}

            {/* Dropzone */}
            <NBCard className="flex-1">
              <div className="nb-card-header-black">
                <span className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                  {isConnected ? 'Drop File to Send' : 'Waiting for Connection'}
                </span>
              </div>
              <div className="p-4">
                <NBDropzone
                  onFileAccepted={onFileAccepted}
                  disabled={!isConnected}
                  className="min-h-[220px]"
                  idleText="DROP FILE OR CLICK TO BROWSE"
                  subText={isConnected ? 'Files transfer directly to the connected peer' : 'A peer must join before you can send files'}
                />
              </div>
            </NBCard>

            {/* Received Files */}
            {receivedFiles.length > 0 && (
              <NBCard>
                <div className="nb-card-header-white">
                  <div className="flex items-center gap-2">
                    <FileDown size={14} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                      Received Files ({receivedFiles.length})
                    </span>
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {receivedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3" style={{ border: 'var(--nb-border-thin)', background: 'var(--nb-gray)' }}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileDown size={16} style={{ flexShrink: 0 }} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-heading)' }}>{file.name}</p>
                          <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <a href={file.url} download={file.name}>
                        <NBButton variant="primary" size="sm">Save</NBButton>
                      </a>
                    </div>
                  ))}
                </div>
              </NBCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPage;
