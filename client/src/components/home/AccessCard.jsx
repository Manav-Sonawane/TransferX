import { useState } from 'react';
import { Download, KeyRound, Clock, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { shareService } from '../../services/share.service';
import NBCard from '../ui/NBCard';
import NBButton from '../ui/NBButton';
import NBInput from '../ui/NBInput';
import NBBadge from '../ui/NBBadge';
import NBCodeInput from '../ui/NBCodeInput';

const formatBytes = (bytes, d = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${s[i]}`;
};

const AccessCard = () => {
  const [code,       setCode      ] = useState('');
  const [codeError,  setCodeError ] = useState('');
  const [loading,    setLoading   ] = useState(false);
  const [shareData,  setShareData ] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [password,   setPassword  ] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const handleCodeChange = (val) => {
    setCode(val);
    if (codeError) setCodeError('');
  };

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!code)             { setCodeError('Enter a share code'); return; }
    if (code.length !== 5) { setCodeError('Must be 5 characters'); return; }
    setLoading(true);
    setFetchError('');
    setShareData(null);
    setPassword('');
    setDownloaded(false);
    try {
      const res = await shareService.getShareByCode(code);
      setShareData(res.data.data);
    } catch (err) {
      setFetchError(err?.response?.data?.message || 'Share not found or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!shareData) return;
    if (shareData.hasPassword && !password) {
      toast.error('Enter the password to download.');
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      if (shareData.hasPassword) {
        // Validate password first to show any errors
        const validationEndpoint = `${apiBase}/shares/${code}/download?password=${encodeURIComponent(password)}`;
        const validationResponse = await fetch(validationEndpoint, {
          method: 'GET',
          credentials: 'include',
        });

        if (!validationResponse.ok) {
          const errorData = await validationResponse.json().catch(() => ({}));
          const remaining = errorData.attemptsRemaining;
          const msg = errorData.message || `Error ${validationResponse.status}`;
          throw new Error(remaining != null ? `${msg} (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)` : msg);
        }

        toast.success('Password accepted! Starting download...');
        setDownloaded(true);
        window.location.href = `${apiBase}/shares/${code}/redirect?password=${encodeURIComponent(password)}`;
      } else {
        toast.success('Download starting...');
        setDownloaded(true);
        window.location.href = `${apiBase}/shares/${code}/redirect`;
      }
    } catch (err) {
      toast.error(err.message || 'Download failed. Please try again.');
    }
  };

  const reset = () => {
    setCode(''); setShareData(null); setFetchError('');
    setPassword(''); setDownloaded(false); setCodeError('');
  };

  const { file, hasPassword, expiry, downloadLimit, downloadCount } = shareData || {};

  /* ─── RENDER ─── */
  return (
    <NBCard className="flex flex-col">
      {/* ── Header strip ── */}
      <div className="nb-card-header-green">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center border-[2px] border-white/60 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Download size={18} color="white" />
          </div>
          <div>
            <h2 className="font-bold text-base uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Access Files
            </h2>
            <p className="text-xs text-white/70 font-bold uppercase tracking-widest mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
              Share Code → Download
            </p>
          </div>
        </div>
        <NBBadge color="white" className="hidden sm:inline-flex">Secure</NBBadge>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* ─ Loading ─ */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 flex-1 nb-slide-up">
            <RefreshCw size={28} className="animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
              Looking up share...
            </p>
          </div>
        )}

        {/* ─ Downloaded success ─ */}
        {downloaded && !loading && (
          <div className="flex flex-col items-center gap-5 py-6 text-center flex-1 nb-slide-up">
            <div className="w-16 h-16 flex items-center justify-center" style={{ background: 'var(--nb-green)', border: 'var(--nb-border)' }}>
              <CheckCircle size={28} color="white" />
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                Download Started!
              </p>
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                Check your downloads folder.
              </p>
            </div>
            <NBButton variant="ghost" onClick={reset}>Access Another File</NBButton>
          </div>
        )}

        {/* ─ Error ─ */}
        {fetchError && !loading && !downloaded && (
          <div className="flex flex-col gap-4 nb-slide-up">
            <div className="flex items-start gap-3 p-3" style={{ background: 'var(--nb-pink)', border: 'var(--nb-border)' }}>
              <AlertCircle size={16} color="white" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold uppercase text-white" style={{ fontFamily: 'var(--font-heading)' }}>✕ Access Failed</p>
                <p className="text-xs text-white/90 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>{fetchError}</p>
              </div>
            </div>
            <NBButton variant="ghost" className="w-full" onClick={reset}>Try Another Code</NBButton>
          </div>
        )}

        {/* ─ File metadata + download ─ */}
        {shareData && !downloaded && !loading && (
          <div className="flex flex-col gap-4 nb-slide-up">
            {/* File metadata table */}
            <div style={{ border: 'var(--nb-border)', background: 'var(--nb-gray)' }}>
              <div className="px-4 py-2 border-b-[3px] border-black flex items-center gap-2" style={{ background: 'var(--nb-green)' }}>
                <CheckCircle size={14} color="white" />
                <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>File Found</span>
              </div>
              <div className="p-3 space-y-0">
                <div className="nb-meta-row">
                  <span className="font-bold opacity-60">FILE</span>
                  <span className="truncate max-w-[60%] text-right">{file?.originalName}</span>
                </div>
                <div className="nb-meta-row">
                  <span className="font-bold opacity-60">SIZE</span>
                  <span>{formatBytes(file?.size)}</span>
                </div>
                {file?.extension && (
                  <div className="nb-meta-row">
                    <span className="font-bold opacity-60">TYPE</span>
                    <span className="uppercase">{file.extension}</span>
                  </div>
                )}
                {expiry && (
                  <div className="nb-meta-row">
                    <span className="font-bold opacity-60 flex items-center gap-1"><Clock size={11} /> EXPIRY</span>
                    <span>{new Date(expiry).toLocaleDateString()}</span>
                  </div>
                )}
                {downloadLimit > 0 && (
                  <div className="nb-meta-row">
                    <span className="font-bold opacity-60">DOWNLOADS</span>
                    <span>{downloadCount} / {downloadLimit}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Password field */}
            {hasPassword && (
              <NBInput
                label={<><KeyRound size={12} className="inline mr-1" />Password Required</>}
                type="password"
                placeholder="Enter share password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              />
            )}

            <NBButton variant="green" className="w-full" onClick={handleDownload}>
              <Download size={16} /> Download File
            </NBButton>

            <button
              onClick={reset}
              className="text-xs text-gray-500 underline w-full text-center"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              access a different file
            </button>
          </div>
        )}

        {/* ─ Idle — code input ─ */}
        {!loading && !shareData && !fetchError && !downloaded && (
          <form onSubmit={handleFetch} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-gray-600 leading-relaxed">
              Enter a share code to access and download the file you received.
            </p>

            <NBCodeInput
              id="access-share-code"
              value={code}
              onChange={handleCodeChange}
              error={codeError}
              placeholder="XXXXX"
              label="Share Code"
            />

            <NBButton type="submit" variant="green" className="w-full">
              <KeyRound size={16} /> Access File
            </NBButton>

            <p className="text-xs text-center text-gray-400" style={{ fontFamily: 'var(--font-mono)' }}>
              Enter the 5-character code shared with you
            </p>
          </form>
        )}
      </div>
    </NBCard>
  );
};

export default AccessCard;
