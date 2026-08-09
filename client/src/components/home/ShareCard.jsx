import { useState, useCallback } from 'react';
import { UploadCloud, X, Copy, RefreshCw, Clock, Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fileService } from '../../services/file.service';
import { shareService } from '../../services/share.service';
import { useAuth } from '../../context/AuthContext';
import NBCard from '../ui/NBCard';
import NBButton from '../ui/NBButton';
import NBInput from '../ui/NBInput';
import NBBadge from '../ui/NBBadge';
import NBDropzone from '../ui/NBDropzone';
import NBProgress from '../ui/NBProgress';

const formatBytes = (bytes, d = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${s[i]}`;
};

const EXPIRY = [
  { v: '1',  l: '1 DAY'  },
  { v: '7',  l: '7 DAYS' },
  { v: '30', l: '30 DAYS'},
];

const ShareCard = () => {
  const { isAuthenticated } = useAuth();

  const [file,          setFile         ] = useState(null);
  const [uploading,     setUploading    ] = useState(false);
  const [progress,      setProgress     ] = useState(0);
  const [uploadedFile,  setUploadedFile ] = useState(null);
  const [expiryDays,    setExpiryDays   ] = useState('7');
  const [sharePassword, setSharePassword] = useState('');
  const [dlLimit,       setDlLimit      ] = useState(0);
  const [generating,    setGenerating   ] = useState(false);
  const [shareCode,     setShareCode    ] = useState('');
  const [shareLink,     setShareLink    ] = useState('');

  const onFileAccepted = useCallback((f) => {
    setFile(f);
    setUploadedFile(null);
    setShareCode('');
    setShareLink('');
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('expiryDays', expiryDays);
    fd.append('visibility', 'public');
    setUploading(true);
    setProgress(0);
    try {
      const res = await fileService.uploadFile(fd, (evt) => {
        setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      setUploadedFile(res.data.data.file);
      setFile(null);
      toast.success('File uploaded!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateShare = async () => {
    if (!uploadedFile) return;
    setGenerating(true);
    try {
      const res = await shareService.createShare({
        fileId:       uploadedFile.id,
        password:     sharePassword || undefined,
        downloadLimit:Number(dlLimit) || 0,
        expiryDays:   Number(expiryDays),
      });
      const { shareCode: code, shareUrl } = res.data.data;
      setShareCode(code);
      setShareLink(shareUrl || `${window.location.origin}/share/${code}`);
      toast.success('Share link generated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate share.');
    } finally {
      setGenerating(false);
    }
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const reset = () => {
    setFile(null); setUploadedFile(null); setShareCode(''); setShareLink('');
    setSharePassword(''); setDlLimit(0); setProgress(0);
  };

  /* ─── RENDER ─── */
  return (
    <NBCard className="flex flex-col">
      {/* ── Header strip ── */}
      <div className="nb-card-header-yellow">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center border-[2px] border-black/30 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <UploadCloud size={18} />
          </div>
          <div>
            <h2 className="font-bold text-base uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
              Share Files
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest mt-0.5 opacity-70" style={{ fontFamily: 'var(--font-mono)' }}>
              Upload → Share Code
            </p>
          </div>
        </div>
        <NBBadge color="black" className="hidden sm:inline-flex">Cloud</NBBadge>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* ─ State: Share created ─ */}
        {shareCode ? (
          <div className="flex flex-col gap-4 nb-slide-up">
            {/* Success badge */}
            <div className="flex items-center gap-2 p-3" style={{ background: 'var(--nb-green)', border: 'var(--nb-border)' }}>
              <CheckCircle size={16} color="white" />
              <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Share Created!
              </span>
            </div>

            {/* Code block */}
            <div style={{ border: 'var(--nb-border)', background: 'var(--nb-gray)' }}>
              <div className="px-4 py-2 border-b-[3px] border-black">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Share Code</span>
              </div>
              <div className="p-4 text-center">
                <div className="text-4xl font-bold tracking-[0.5em] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                  {shareCode}
                </div>
                <NBButton variant="ghost" size="sm" onClick={() => copy(shareCode, 'Code')}>
                  <Copy size={12} /> Copy Code
                </NBButton>
              </div>
            </div>

            {/* Link block */}
            <div style={{ border: 'var(--nb-border)', background: 'var(--nb-gray)' }} className="p-3">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>Share Link</p>
              <div className="flex items-center gap-2">
                <code className="text-xs flex-1 min-w-0 truncate" style={{ fontFamily: 'var(--font-mono)', color: '#4A90D9' }}>{shareLink}</code>
                <NBButton variant="ghost" size="sm" onClick={() => copy(shareLink, 'Link')}>
                  <Copy size={12} /> Copy
                </NBButton>
              </div>
            </div>

            <NBButton variant="black" className="w-full" onClick={reset}>
              <RefreshCw size={14} /> Share Another File
            </NBButton>
          </div>

        ) : uploadedFile ? (
          /* ─ State: Config & generate share ─ */
          <div className="flex flex-col gap-4 nb-slide-up">
            {/* File chip */}
            <div className="nb-file-chip">
              <CheckCircle size={16} style={{ color: 'var(--nb-green)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-heading)' }}>{uploadedFile.originalName}</p>
                <p className="text-xs font-medium" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{formatBytes(uploadedFile.size)}</p>
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className="nb-label flex items-center gap-1.5"><Clock size={12} /> Expiry</label>
              <div className="flex gap-2">
                {EXPIRY.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setExpiryDays(o.v)}
                    className="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-100"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      border: 'var(--nb-border-thin)',
                      background: expiryDays === o.v ? 'var(--nb-yellow)' : 'white',
                      boxShadow: expiryDays === o.v ? 'var(--nb-shadow-sm)' : 'none',
                    }}
                  >{o.l}</button>
                ))}
              </div>
            </div>

            {/* Auth-gated options */}
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <NBInput
                  label={<><Shield size={12} className="inline mr-1" />Password (optional)</>}
                  type="password"
                  placeholder="Protect with a password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                />
                <NBInput
                  label="Download Limit (0 = unlimited)"
                  type="number"
                  placeholder="e.g. 5"
                  value={dlLimit}
                  onChange={(e) => setDlLimit(e.target.value)}
                  min="0"
                />
              </div>
            ) : (
              <p className="text-xs text-gray-500 p-3" style={{ border: '2px solid #E8E5DC', background: 'var(--nb-gray)', fontFamily: 'var(--font-mono)' }}>
                <Link to="/login" style={{ color: 'var(--nb-blue)', fontWeight: 700 }}>Log in</Link> to enable password protection and download limits.
              </p>
            )}

            <NBButton variant="primary" className="w-full" onClick={handleGenerateShare} loading={generating}>
              Generate Share Link
            </NBButton>

            <button
              onClick={reset}
              className="text-xs text-gray-500 underline w-full text-center"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              upload a different file
            </button>
          </div>

        ) : uploading ? (
          /* ─ State: Uploading ─ */
          <div className="flex flex-col gap-4 py-4 nb-slide-up flex-1 justify-center">
            <NBProgress progress={progress} accent="black" label="UPLOADING" />
            <p className="text-xs text-center font-medium truncate" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
              {file?.name}
            </p>
          </div>

        ) : file ? (
          /* ─ State: File selected ─ */
          <div className="flex flex-col gap-4 nb-slide-up">
            {/* File chip */}
            <div className="nb-file-chip">
              <UploadCloud size={16} style={{ flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-heading)' }}>{file.name}</p>
                <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-1 hover:bg-gray-200 transition-colors flex-shrink-0"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>

            {/* Expiry selector */}
            <div>
              <label className="nb-label flex items-center gap-1.5"><Clock size={12} /> Expiry</label>
              <div className="flex gap-2">
                {EXPIRY.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setExpiryDays(o.v)}
                    className="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-100"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      border: 'var(--nb-border-thin)',
                      background: expiryDays === o.v ? 'var(--nb-yellow)' : 'white',
                      boxShadow: expiryDays === o.v ? 'var(--nb-shadow-sm)' : 'none',
                    }}
                  >{o.l}</button>
                ))}
              </div>
            </div>

            <NBButton variant="primary" className="w-full" onClick={handleUpload}>
              <UploadCloud size={16} /> Upload & Create Share
            </NBButton>
          </div>

        ) : (
          /* ─ State: Idle — Dropzone ─ */
          <NBDropzone
            onFileAccepted={onFileAccepted}
            className="flex-1 min-h-[200px]"
          />
        )}
      </div>
    </NBCard>
  );
};

export default ShareCard;
