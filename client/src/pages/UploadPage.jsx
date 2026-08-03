import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react';
import { fileService } from '../services/file.service';
import { shareService } from '../services/share.service';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [expiryDays, setExpiryDays] = useState('7');
  const [visibility, setVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const { isAuthenticated } = useAuth();
  const [sharePassword, setSharePassword] = useState('');
  const [shareDownloadLimit, setShareDownloadLimit] = useState(0);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareCode, setShareCode] = useState('');



  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadedFile(null); // Reset if uploading a new file
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    // Reset previous share link state on new upload
    setUploadedFile(null);
    setShareLink('');
    setShareCode('');
    setSharePassword('');
    setShareDownloadLimit(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('expiryDays', expiryDays);
    formData.append('visibility', visibility);

    setUploading(true);
    setProgress(0);

    try {
      const response = await fileService.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });

      setUploadedFile(response.data.data.file);
      toast.success('File uploaded successfully!');
      setFile(null);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateShare = async () => {
    if (!uploadedFile) return;

    setGeneratingShare(true);
    try {
      const response = await shareService.createShare({
        fileId: uploadedFile.id,
        password: sharePassword || undefined,
        downloadLimit: Number(shareDownloadLimit) || 0,
        expiryDays: Number(expiryDays),
      });

      const { shareCode, shareUrl } = response.data.data;
      setShareCode(shareCode);
      setShareLink(shareUrl || `${window.location.origin}/share/${shareCode}`);
      toast.success('Share link generated!');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to generate share link.';
      toast.error(msg);
    } finally {
      setGeneratingShare(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setUploadedFile(null);
    setShareLink('');
    setShareCode('');
    setSharePassword('');
    setShareDownloadLimit(0);
  };


  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  // Format bytes helper
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="page-container py-12 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Upload a File</h1>
        <p className="text-surface-400">Securely upload and share files up to 100MB.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Left Side — Dropzone */}
        <div className="md:col-span-3">
          {!file && !uploadedFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-primary-500 bg-primary-500/10'
                  : isDragReject
                  ? 'border-danger-500 bg-danger-500/10'
                  : 'border-surface-700 bg-surface-800/50 hover:border-surface-600 hover:bg-surface-800'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={32} className="text-surface-400" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-white mb-2">
                {isDragActive ? 'Drop file here' : 'Drag & drop your file here'}
              </h3>
              <p className="text-surface-400 text-sm mb-6">or click to browse from your device</p>
              <button className="btn-primary">Select File</button>
              <p className="text-xs text-surface-500 mt-4">Max file size: 100MB</p>
            </div>
          )}

          {/* Selected File State */}
          {file && !uploading && (
            <div className="card p-6 border-primary-500/30 bg-primary-500/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-800 flex items-center justify-center">
                    <FileIcon size={24} className="text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-white truncate max-w-xs">{file.name}</h4>
                    <p className="text-sm text-surface-400">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1.5 rounded-md hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Uploading State */}
          {uploading && (
            <div className="card p-8 text-center border-surface-700">
              <div className="mb-6 relative w-20 h-20 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-surface-800"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={226.2}
                    strokeDashoffset={226.2 - (progress / 100) * 226.2}
                    className="text-primary-500 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-heading font-bold text-white">{progress}%</span>
                </div>
              </div>
              <h3 className="font-heading font-semibold text-white mb-1">Uploading...</h3>
              <p className="text-sm text-surface-400">{file?.name}</p>
            </div>
          )}

          {/* Upload Success State */}
          {uploadedFile && (
            <div className="card p-8 border-success-500/30 bg-success-500/5 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-success-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-success-500" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-white mb-2">Upload Complete!</h3>
                <p className="text-surface-400 truncate">{uploadedFile.originalName}</p>
              </div>

              {!shareLink ? (
                <div className="space-y-4 border-t border-surface-800 pt-6 text-left">
                  <h4 className="font-heading font-semibold text-white">Generate Shareable Link</h4>
                  
                  {isAuthenticated ? (
                    <div className="space-y-4 animate-fade-in">
                      <div>
                        <label htmlFor="sharePassword" className="label">Password Protection (Optional)</label>
                        <input
                          id="sharePassword"
                          type="password"
                          placeholder="Set a password for this link"
                          value={sharePassword}
                          onChange={(e) => setSharePassword(e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label htmlFor="shareDownloadLimit" className="label">Download Limit (Optional, 0 for unlimited)</label>
                        <input
                          id="shareDownloadLimit"
                          type="number"
                          placeholder="e.g. 5 downloads"
                          value={shareDownloadLimit}
                          onChange={(e) => setShareDownloadLimit(e.target.value)}
                          className="input"
                          min="0"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-surface-500 bg-surface-900 p-3 rounded-lg border border-surface-800">
                      ℹ️ Guests cannot password-protect or limit downloads. Please log in to unlock advanced sharing controls.
                    </p>
                  )}

                  <button
                    onClick={handleGenerateShare}
                    disabled={generatingShare}
                    className="btn-primary w-full"
                  >
                    {generatingShare ? 'Generating...' : 'Generate Share Link'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 border-t border-surface-800 pt-6 text-left animate-fade-in">
                  <h4 className="font-heading font-semibold text-white text-center text-lg">Share Created Successfully 🎉</h4>
                  
                  {/* Share Code (Emphasized) */}
                  <div className="bg-surface-900 rounded-2xl p-5 border border-surface-700 text-center space-y-2">
                    <span className="text-xs uppercase tracking-wider text-surface-400 font-semibold">Share Code</span>
                    <div className="text-4xl font-heading font-bold text-white tracking-widest uppercase select-all">
                      {shareCode}
                    </div>
                    <button
                      onClick={() => copyToClipboard(shareCode)}
                      className="btn-secondary btn-sm px-6"
                    >
                      Copy Code
                    </button>
                  </div>

                  {/* Share Link */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-surface-400 font-semibold">Share Link</span>
                    <div className="bg-surface-900 rounded-lg p-3 flex items-center justify-between border border-surface-700">
                      <code className="text-sm text-primary-400 truncate max-w-[200px] sm:max-w-xs">
                        {shareLink}
                      </code>
                      <button
                        onClick={() => copyToClipboard(shareLink)}
                        className="btn-secondary btn-sm"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center border-t border-surface-800 pt-6">
                <button onClick={resetAll} className="btn-secondary w-full">
                  Upload Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side — Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6 border-surface-800">
            <h3 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary-400" />
              Expiry Settings
            </h3>
            <div className="space-y-3">
              {[
                { value: '1', label: '1 Day' },
                { value: '7', label: '7 Days' },
                { value: '30', label: '30 Days' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    expiryDays === option.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-700 bg-surface-900 hover:border-surface-600'
                  }`}
                >
                  <span className="text-sm font-medium text-white">{option.label}</span>
                  <input
                    type="radio"
                    name="expiryDays"
                    value={option.value}
                    checked={expiryDays === option.value}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="hidden"
                  />
                  {expiryDays === option.value && <CheckCircle size={16} className="text-primary-500" />}
                </label>
              ))}
            </div>
          </div>

          <div className="card p-6 border-surface-800">
            <h3 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-primary-400" />
              Visibility
            </h3>
            <div className="space-y-3">
              {[
                { value: 'public', label: 'Public (Anyone with link)' },
                { value: 'private', label: 'Private (Only you)' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    visibility === option.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-700 bg-surface-900 hover:border-surface-600'
                  }`}
                >
                  <span className="text-sm font-medium text-white">{option.label}</span>
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="hidden"
                  />
                  {visibility === option.value && <CheckCircle size={16} className="text-primary-500" />}
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-surface-500 flex items-start gap-1.5">
              <AlertCircle size={14} className="flex-shrink-0" />
              Private files cannot be shared until visibility is changed to public.
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary w-full py-3"
          >
            {uploading ? 'Uploading...' : 'Start Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
