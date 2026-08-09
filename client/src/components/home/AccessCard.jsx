import { useState } from 'react';
import { shareService } from '../../services/share.service';
import {
  Download, KeyRound, File as FileIcon, Clock,
  AlertCircle, RefreshCw, ShieldAlert, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const AccessCard = () => {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [password, setPassword] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(val);
    if (codeError) setCodeError('');
  };

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!code) { setCodeError('Please enter a share code'); return; }
    if (code.length !== 5) { setCodeError('Code must be exactly 5 characters'); return; }

    setLoading(true);
    setFetchError('');
    setShareData(null);
    setPassword('');
    setDownloaded(false);

    try {
      const res = await shareService.getShareByCode(code);
      setShareData(res.data.data);
    } catch (err) {
      setFetchError(err?.response?.data?.message || 'Share not found or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!shareData) return;
    if (shareData.hasPassword && !password) {
      toast.error('Enter the password to download.');
      return;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${apiBase}/shares/${code}/download${password ? `?password=${encodeURIComponent(password)}` : ''}`;

    // Use a hidden anchor click rather than window.location.href so the browser
    // handles the download without navigating away from the React app.
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success('Download starting...');
    setDownloaded(true);
  };

  const handleReset = () => {
    setCode('');
    setShareData(null);
    setFetchError('');
    setPassword('');
    setDownloaded(false);
    setCodeError('');
  };

  const { file, hasPassword, expiry, downloadLimit, downloadCount } = shareData || {};

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="card flex flex-col border-surface-800 bg-surface-900/60 backdrop-blur-xl">
      {/* ── Header ── */}
      <div className="p-6 border-b border-surface-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-success-500/15 border border-success-500/20 flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-success-500" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-base leading-tight">Access Files</h2>
            <p className="text-xs text-surface-500 mt-0.5">Share Code → Download</p>
          </div>
        </div>
        <p className="text-sm text-surface-400 leading-relaxed">
          Enter a share code provided by the sender to access and download a file.
        </p>
      </div>

      {/* ── Body ── */}
      <div className="p-6 flex flex-col gap-5 flex-1">

        {/* ── State: Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 animate-fade-in flex-1">
            <RefreshCw size={28} className="animate-spin text-primary-500" />
            <p className="text-sm text-surface-400">Looking up share...</p>
          </div>
        )}

        {/* ── State: Download started ── */}
        {downloaded && !loading && (
          <div className="flex flex-col items-center gap-5 py-6 animate-fade-in text-center flex-1">
            <div className="w-14 h-14 rounded-full bg-success-500/20 flex items-center justify-center">
              <CheckCircle size={28} className="text-success-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Download Started!</p>
              <p className="text-xs text-surface-500 mt-1">Check your downloads folder.</p>
            </div>
            <button onClick={handleReset} className="btn-outline text-sm py-2.5 px-6">
              Access Another File
            </button>
          </div>
        )}

        {/* ── State: Error ── */}
        {fetchError && !loading && !downloaded && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start gap-3 p-4 bg-danger-500/5 border border-danger-500/20 rounded-xl">
              <ShieldAlert size={18} className="text-danger-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Access Failed</p>
                <p className="text-xs text-surface-400 mt-0.5 leading-relaxed">{fetchError}</p>
              </div>
            </div>
            <button onClick={handleReset} className="btn-outline w-full text-sm py-2.5">
              Try Another Code
            </button>
          </div>
        )}

        {/* ── State: File metadata + download ── */}
        {shareData && !downloaded && !loading && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* File chip */}
            <div className="flex items-center gap-3 p-3 bg-surface-950/60 border border-surface-700 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0">
                <FileIcon size={20} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{file?.originalName}</p>
                <p className="text-xs text-surface-400 mt-0.5">
                  {formatBytes(file?.size)} · {file?.extension?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-surface-400">
              {expiry && (
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-surface-500" />
                  <span>Expires {new Date(expiry).toLocaleDateString()}</span>
                </div>
              )}
              {downloadLimit > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-surface-500" />
                  <span>{downloadCount} / {downloadLimit} downloads used</span>
                </div>
              )}
            </div>

            {/* Password field (only if required) */}
            {hasPassword && (
              <div>
                <label className="label flex items-center gap-1.5">
                  <KeyRound size={13} className="text-primary-400" />
                  Password required
                </label>
                <input
                  type="password"
                  placeholder="Enter share password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                />
              </div>
            )}

            <button
              onClick={handleDownload}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-semibold"
            >
              <Download size={18} /> Download File
            </button>

            <button onClick={handleReset} className="btn-ghost text-xs text-surface-500 w-full">
              Access a different file
            </button>
          </div>
        )}

        {/* ── State: Idle — code input ── */}
        {!loading && !shareData && !fetchError && !downloaded && (
          <form onSubmit={handleFetch} className="flex flex-col gap-4" noValidate>
            <div>
              <input
                type="text"
                placeholder="SHARE CODE"
                value={code}
                onChange={handleCodeChange}
                maxLength={5}
                className={`input text-center text-xl font-bold tracking-[0.4em] uppercase py-3.5 font-mono ${codeError ? 'input-error' : ''}`}
              />
              {codeError && (
                <p className="mt-1.5 text-xs text-danger-500 flex items-center justify-center gap-1">
                  <AlertCircle size={12} /> {codeError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-semibold"
            >
              <KeyRound size={16} /> Access File
            </button>

            <p className="text-xs text-surface-600 text-center leading-relaxed">
              Enter the 5-character code shared with you
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccessCard;
