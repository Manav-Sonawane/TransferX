import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react';
import { fileService } from '../services/file.service';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [expiryDays, setExpiryDays] = useState('7');
  const [visibility, setVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);

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
            <div className="card p-8 text-center border-success-500/30 bg-success-500/5">
              <div className="w-16 h-16 rounded-full bg-success-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-success-500" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-white mb-2">Upload Complete!</h3>
              <p className="text-surface-400 mb-6 truncate">{uploadedFile.fileName}</p>

              <div className="bg-surface-900 rounded-lg p-3 flex items-center justify-between border border-surface-700 mb-6">
                <code className="text-sm text-primary-400 truncate max-w-[200px] sm:max-w-xs text-left">
                  {uploadedFile.storageUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(uploadedFile.storageUrl)}
                  className="btn-secondary btn-sm"
                >
                  Copy URL
                </button>
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={() => setUploadedFile(null)} className="btn-secondary">
                  Upload Another
                </button>
                {/* We'll add the Share redirect button here in Phase 4 */}
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
