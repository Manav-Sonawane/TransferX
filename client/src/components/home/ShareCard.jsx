import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud, File as FileIcon, X, CheckCircle,
  Copy, RefreshCw, Clock, Shield, AlertCircle,
} from 'lucide-react';
import { fileService } from '../../services/file.service';
import { shareService } from '../../services/share.service';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const EXPIRY_OPTIONS = [
  { v: '1', l: '1 Day' },
  { v: '7', l: '7 Days' },
  { v: '30', l: '30 Days' },
];

const ShareCard = () => {
  const { isAuthenticated } = useAuth();

  // Upload state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Share config state
  const [expiryDays, setExpiryDays] = useState('7');
  const [sharePassword, setSharePassword] = useState('');
  const [shareDownloadLimit, setShareDownloadLimit] = useState(0);

  // Share result state
  const [generatingShare, setGeneratingShare] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [shareLink, setShareLink] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      // Clear any previous upload/share state
      setUploadedFile(null);
      setShareCode('');
      setShareLink('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100 MB — matches backend limit
  });

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('expiryDays', expiryDays);
    formData.append('visibility', 'public');

    setUploading(true);
    setProgress(0);
    try {
      const res = await fileService.uploadFile(formData, (evt) => {
        setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      setUploadedFile(res.data.data.file);
      setFile(null);
      toast.success('File uploaded!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateShare = async () => {
    if (!uploadedFile) return;
    setGeneratingShare(true);
    try {
      const res = await shareService.createShare({
        fileId: uploadedFile.id,
        password: sharePassword || undefined,
        downloadLimit: Number(shareDownloadLimit) || 0,
        expiryDays: Number(expiryDays),
      });
      const { shareCode: code, shareUrl } = res.data.data;
      setShareCode(code);
      setShareLink(shareUrl || `${window.location.origin}/share/${code}`);
      toast.success('Share link generated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate share link.');
    } finally {
      setGeneratingShare(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const resetAll = () => {
    setFile(null);
    setUploadedFile(null);
    setShareCode('');
    setShareLink('');
    setSharePassword('');
    setShareDownloadLimit(0);
    setProgress(0);
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="card flex flex-col border-surface-800 bg-surface-900/60 backdrop-blur-xl">
      {/* ── Header ── */}
      <div className="p-6 border-b border-surface-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
            <UploadCloud size={20} className="text-primary-400" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-base leading-tight">Share Files</h2>
            <p className="text-xs text-surface-500 mt-0.5">Upload → Share Code</p>
          </div>
        </div>
        <p className="text-sm text-surface-400 leading-relaxed">
          Upload a file and generate a secure share code. Files are stored until expiry.
        </p>
      </div>

      {/* ── Body ── */}
      <div className="p-6 flex flex-col gap-5 flex-1">

        {/* ── State: Share created ── */}
        {shareCode ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-success-500/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={24} className="text-success-500" />
              </div>
              <p className="text-sm font-semibold text-white">Share Created!</p>
            </div>

            {/* Code block */}
            <div className="bg-surface-950 rounded-xl p-4 border border-surface-700 text-center space-y-3">
              <p className="text-xs uppercase tracking-widest text-surface-500 font-semibold">Share Code</p>
              <div className="text-4xl font-heading font-bold text-white tracking-[0.3em] select-all font-mono">
                {shareCode}
              </div>
              <button
                onClick={() => copyToClipboard(shareCode, 'Code')}
                className="btn-outline btn-sm gap-1.5"
              >
                <Copy size={12} /> Copy Code
              </button>
            </div>

            {/* Link block */}
            <div className="bg-surface-950 rounded-xl p-3 border border-surface-700 space-y-2">
              <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Share Link</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-primary-400 truncate flex-1 min-w-0">{shareLink}</code>
                <button
                  onClick={() => copyToClipboard(shareLink, 'Link')}
                  className="btn-outline btn-sm gap-1 flex-shrink-0"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>

            <button onClick={resetAll} className="btn-ghost w-full text-sm py-2.5 border border-surface-800 gap-2">
              <RefreshCw size={14} /> Share Another File
            </button>
          </div>

        ) : uploadedFile ? (
          /* ── State: Uploaded — configure & generate share ── */
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Uploaded file chip */}
            <div className="flex items-center gap-3 p-3 bg-success-500/5 border border-success-500/20 rounded-xl">
              <CheckCircle size={18} className="text-success-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{uploadedFile.originalName}</p>
                <p className="text-xs text-surface-500">{formatBytes(uploadedFile.size)} · Uploaded</p>
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Clock size={13} /> Expiry
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPIRY_OPTIONS.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setExpiryDays(o.v)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                      expiryDays === o.v
                        ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                        : 'border-surface-700 text-surface-400 hover:border-surface-600 hover:text-surface-300'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth-gated controls */}
            {isAuthenticated ? (
              <div className="space-y-3">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Shield size={13} /> Password <span className="text-surface-600 font-normal">(optional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Protect with a password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label">Download Limit <span className="text-surface-600 font-normal">(0 = unlimited)</span></label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={shareDownloadLimit}
                    onChange={(e) => setShareDownloadLimit(e.target.value)}
                    min="0"
                    className="input text-sm"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-surface-500 bg-surface-950 p-3 rounded-lg border border-surface-800 leading-relaxed">
                ℹ️{' '}
                <Link to="/login" className="text-primary-400 hover:underline">Log in</Link>{' '}
                to enable password protection and download limits.
              </p>
            )}

            <button
              onClick={handleGenerateShare}
              disabled={generatingShare}
              className="btn-primary w-full py-3 text-sm font-semibold"
            >
              {generatingShare ? 'Generating...' : 'Generate Share Link'}
            </button>

            <button
              onClick={resetAll}
              className="btn-ghost text-xs text-surface-500 w-full"
            >
              Upload a different file
            </button>
          </div>

        ) : uploading ? (
          /* ── State: Uploading ── */
          <div className="flex flex-col items-center justify-center gap-4 py-8 animate-fade-in flex-1">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-800" />
                <circle
                  cx="40" cy="40" r="36"
                  stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={226.2}
                  strokeDashoffset={226.2 - (progress / 100) * 226.2}
                  className="text-primary-500 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-heading font-bold text-white text-sm">{progress}%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Uploading...</p>
              <p className="text-xs text-surface-500 truncate max-w-[200px] mt-1">{file?.name}</p>
            </div>
          </div>

        ) : file ? (
          /* ── State: File selected ── */
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* File chip */}
            <div className="flex items-start gap-3 p-3 bg-primary-500/5 border border-primary-500/20 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0">
                <FileIcon size={18} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                <p className="text-xs text-surface-400 mt-0.5">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-1 hover:bg-surface-800 rounded transition-colors text-surface-500 hover:text-white flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick expiry selector */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Clock size={13} /> Expiry
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPIRY_OPTIONS.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setExpiryDays(o.v)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                      expiryDays === o.v
                        ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                        : 'border-surface-700 text-surface-400 hover:border-surface-600 hover:text-surface-300'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleUpload}
              className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <UploadCloud size={16} /> Upload & Create Share
            </button>
          </div>

        ) : (
          /* ── State: Idle — Dropzone ── */
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[180px] flex-1 ${
              isDragActive
                ? 'border-primary-500 bg-primary-500/10 scale-[1.01]'
                : isDragReject
                ? 'border-danger-500 bg-danger-500/5'
                : 'border-surface-700 hover:border-surface-500 hover:bg-surface-800/40'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mb-3">
              <UploadCloud size={22} className={isDragActive ? 'text-primary-400' : 'text-surface-400'} />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              {isDragActive ? 'Drop it here!' : 'Drop file or click to browse'}
            </p>
            <p className="text-xs text-surface-500">Max 100 MB · Any file type</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareCard;
