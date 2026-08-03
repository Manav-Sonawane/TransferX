import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AccessPage = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!code) {
      setError('Please enter a share code');
      return;
    }

    if (code.length !== 5) {
      setError('Code must be exactly 5 characters');
      return;
    }

    // Redirect to the dedicated download/share page
    navigate(`/share/${code}`);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md card p-8 border-surface-800 bg-surface-900/60 backdrop-blur-xl animate-fade-in text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto shadow-glow-blue">
          <KeyRound size={28} className="text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-heading font-bold text-white mb-2">Access Shared File</h1>
          <p className="text-surface-400 text-sm">
            Enter the 5-character share code you received to download the file.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <input
              type="text"
              placeholder="e.g. XYA5G"
              value={code}
              onChange={handleInputChange}
              maxLength={5}
              className={`input text-center text-3xl font-bold tracking-widest uppercase py-3 ${
                error ? 'input-error' : ''
              }`}
            />
            {error && (
              <p className="mt-2 text-xs text-danger-500 flex items-center justify-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Download size={18} />
            Access File
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessPage;
