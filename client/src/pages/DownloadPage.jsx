import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shareService } from '../services/share.service';
import { File as FileIcon, Clock, ShieldAlert, Download, AlertCircle, RefreshCw, KeyRound, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import NBCard from '../components/ui/NBCard';
import NBButton from '../components/ui/NBButton';
import NBBadge from '../components/ui/NBBadge';

const DownloadPage = () => {
  const { code } = useParams();
  const [loading, setLoading]     = useState(true);
  const [shareData, setShareData] = useState(null);
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const fetchShareDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await shareService.getShareByCode(code);
      setShareData(response.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load share link details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) fetchShareDetails();
  }, [code]);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!shareData) return;
    if (shareData.hasPassword && !password) {
      toast.error('Enter the password to download.');
      return;
    }

    setDownloading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      if (shareData.hasPassword) {
        // Step 1: Validate password first to get proper error messages & rate limiting
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

        // Step 2: Password valid — navigate to redirect endpoint (browser follows 302 to Cloudinary)
        toast.success('Password accepted! Starting download...');
        setDownloaded(true);
        window.location.href = `${apiBase}/shares/${code}/redirect?password=${encodeURIComponent(password)}`;
      } else {
        // No password — navigate directly to the redirect endpoint
        // Browser follows the 302 redirect straight to Cloudinary CDN
        toast.success('Starting download...');
        setDownloaded(true);
        window.location.href = `${apiBase}/shares/${code}/redirect`;
      }
    } catch (err) {
      toast.error(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formatBytes = (bytes, d = 2) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${s[i]}`;
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="nb-page min-h-screen flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin" size={32} />
          <p className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
            Loading share...
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="nb-page min-h-screen flex flex-col justify-center items-center px-4">
        <NBCard className="w-full max-w-md text-center">
          <div className="nb-card-header-black">
            <span className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-mono)' }}>
              Error
            </span>
          </div>
          <div className="p-8 flex flex-col items-center gap-5">
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{ background: 'var(--nb-pink)', border: 'var(--nb-border)' }}
            >
              <ShieldAlert size={32} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Access Error
              </h1>
              <p className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{error}</p>
            </div>
            <Link to="/" className="block w-full">
              <NBButton variant="ghost" className="w-full">← Back to Home</NBButton>
            </Link>
          </div>
        </NBCard>
      </div>
    );
  }

  const { file, hasPassword, expiry, downloadLimit, downloadCount } = shareData;

  return (
    <div className="nb-page min-h-screen flex flex-col justify-center items-center px-4 py-10">
      <NBCard className="w-full max-w-md">

        {/* Header strip */}
        <div className="nb-card-header-black">
          <div className="flex items-center gap-2">
            <Download size={14} color="white" />
            <span className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-mono)' }}>
              File Download
            </span>
          </div>
          <NBBadge color="green">Secure</NBBadge>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* File icon + name */}
          <div className="flex flex-col items-center text-center gap-3">
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{ background: 'var(--nb-black)', border: 'var(--nb-border)' }}
            >
              <FileIcon size={32} color="var(--nb-yellow)" />
            </div>
            <div>
              <p
                className="font-bold text-lg truncate max-w-[300px]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {file?.originalName}
              </p>
              <p className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
                {formatBytes(file?.size)}{file?.extension ? ` · ${file.extension.toUpperCase()}` : ''}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div style={{ border: 'var(--nb-border)', background: 'var(--nb-gray)' }}>
            <div className="px-4 py-2 border-b-[2px] border-black">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Details</span>
            </div>
            <div className="p-3 space-y-0">
              {expiry && (
                <div className="nb-meta-row">
                  <span className="font-bold opacity-60 flex items-center gap-1"><Clock size={11} /> EXPIRES</span>
                  <span>{new Date(expiry).toLocaleDateString()}</span>
                </div>
              )}
              {downloadLimit > 0 && (
                <div className="nb-meta-row">
                  <span className="font-bold opacity-60 flex items-center gap-1"><AlertCircle size={11} /> DOWNLOADS</span>
                  <span>{downloadCount} / {downloadLimit}</span>
                </div>
              )}
              <div className="nb-meta-row">
                <span className="font-bold opacity-60">CODE</span>
                <span className="tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>{code}</span>
              </div>
            </div>
          </div>

          {/* Password field */}
          {hasPassword && (
            <div>
              <label className="nb-label flex items-center gap-1.5">
                <KeyRound size={12} /> Password Required
              </label>
              <input
                type="password"
                placeholder="Enter share password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                className="nb-input text-center"
              />
            </div>
          )}

          {/* Download button / success state */}
          {downloaded ? (
            <div
              className="flex items-center gap-3 p-4"
              style={{ background: 'var(--nb-green)', border: 'var(--nb-border)' }}
            >
              <CheckCircle size={20} color="white" />
              <div>
                <p className="font-bold text-white uppercase tracking-wider text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                  Download Started!
                </p>
                <p className="text-xs text-white/80 mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                  Check your downloads folder.
                </p>
              </div>
            </div>
          ) : (
            <NBButton variant="primary" className="w-full" onClick={handleDownload} loading={downloading}>
              <Download size={18} /> {downloading ? 'Downloading...' : 'Download File'}
            </NBButton>
          )}

          <Link
            to="/"
            className="text-xs text-center underline hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}
          >
            ← Back to home
          </Link>
        </div>
      </NBCard>
    </div>
  );
};

export default DownloadPage;
