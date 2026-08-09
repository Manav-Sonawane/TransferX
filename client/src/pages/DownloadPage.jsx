import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shareService } from '../services/share.service';
import { File as FileIcon, Clock, ShieldAlert, Download, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const DownloadPage = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    if (code) {
      fetchShareDetails();
    }
  }, [code]);

  const handleDownload = () => {
    if (!shareData) return;
    
    if (shareData.hasPassword && !password) {
      toast.error('This file is password protected. Enter the password to download.');
      return;
    }

    // Build the secure download URL targeting the backend redirect endpoint
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const downloadUrl = `${apiBaseUrl}/shares/${code}/download${password ? `?password=${encodeURIComponent(password)}` : ''}`;
    
    // Use a hidden anchor click so the page doesn't navigate away during the
    // backend → Cloudinary redirect chain.
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download starting...');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex justify-center items-center">
        <RefreshCw className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md card p-8 border-danger-500/20 bg-danger-500/5 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-danger-500/10 flex items-center justify-center mx-auto text-danger-500">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-white mb-2">Access Error</h1>
            <p className="text-surface-400 text-sm">{error}</p>
          </div>
          <Link to="/access" className="btn-secondary w-full block py-2.5">
            Back to Access Page
          </Link>
        </div>
      </div>
    );
  }

  const { file, hasPassword, expiry, downloadLimit, downloadCount } = shareData;

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md card p-8 border-surface-800 bg-surface-900/60 backdrop-blur-xl animate-fade-in text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto text-primary-400">
          <FileIcon size={32} />
        </div>

        <div>
          <h1 className="text-xl font-heading font-bold text-white mb-1 truncate">{file?.originalName}</h1>
          <p className="text-surface-400 text-sm">{formatBytes(file?.size)} • {file?.extension.toUpperCase()}</p>
        </div>

        <div className="space-y-3 bg-surface-950/60 p-4 rounded-xl border border-surface-800 text-left text-sm text-surface-400">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-surface-500" />
            <span>Expires: {new Date(expiry).toLocaleDateString()}</span>
          </div>
          {downloadLimit > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-surface-500" />
              <span>Downloads: {downloadCount} / {downloadLimit} max</span>
            </div>
          )}
        </div>

        {hasPassword && (
          <div className="space-y-2 text-left">
            <label className="label flex items-center gap-2">
              <KeyRound size={14} className="text-primary-400" />
              This file requires a password:
            </label>
            <input
              type="password"
              placeholder="Enter share password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input text-center"
            />
          </div>
        )}

        <button
          onClick={handleDownload}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Download File
        </button>

        <Link to="/access" className="text-sm text-surface-400 hover:text-white transition-colors block">
          Enter different code
        </Link>
      </div>
    </div>
  );
};

export default DownloadPage;
