import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const P2PPage = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSessionCode(value);
    if (error) setError('');
  };

  const handleCreateSession = () => {
    // Navigate to session page with 'new' which indicates creation
    navigate('/p2p/new');
  };

  const handleJoinSession = (e) => {
    e.preventDefault();

    if (!sessionCode) {
      setError('Please enter a session code');
      return;
    }

    if (sessionCode.length !== 5) {
      setError('Code must be exactly 5 characters');
      return;
    }

    navigate(`/p2p/${sessionCode}`);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-secondary-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto shadow-glow-blue mb-6">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">P2P Transfer</h1>
          <p className="text-surface-400">
            Send files directly to another device instantly, without uploading to the cloud.
          </p>
        </div>

        <div className="card p-8 border-surface-800 bg-surface-900/60 backdrop-blur-xl">
          <button
            onClick={handleCreateSession}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 mb-8 text-lg"
          >
            <Plus size={20} />
            Create New Session
          </button>

          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-800"></div>
            </div>
            <div className="relative px-4 bg-surface-900 text-surface-500 text-sm">
              OR JOIN EXISTING
            </div>
          </div>

          <form onSubmit={handleJoinSession} className="space-y-4" noValidate>
            <div>
              <input
                type="text"
                placeholder="ENTER 5-DIGIT CODE"
                value={sessionCode}
                onChange={handleInputChange}
                maxLength={5}
                className={`input text-center text-2xl font-bold tracking-widest uppercase py-3 ${
                  error ? 'input-error' : ''
                }`}
              />
              {error && (
                <p className="mt-2 text-xs text-danger-500 flex items-center justify-center gap-1">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </div>

            <button type="submit" className="w-full btn-secondary py-3 flex items-center justify-center gap-2">
              Join Session <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default P2PPage;
