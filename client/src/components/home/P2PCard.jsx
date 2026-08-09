import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Plus, ArrowRight, AlertCircle } from 'lucide-react';

const P2PCard = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSessionCode(val);
    if (error) setError('');
  };

  const handleCreateSession = () => {
    navigate('/p2p/new');
  };

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (!sessionCode) { setError('Please enter a session code'); return; }
    if (sessionCode.length !== 5) { setError('Code must be exactly 5 characters'); return; }
    navigate(`/p2p/${sessionCode}`);
  };

  return (
    <div className="card flex flex-col border-surface-800 bg-surface-900/60 backdrop-blur-xl">
      {/* ── Header ── */}
      <div className="p-6 border-b border-surface-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-500/15 border border-secondary-500/20 flex items-center justify-center flex-shrink-0">
            <Network size={20} className="text-secondary-400" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white text-base leading-tight">P2P Transfer</h2>
            <p className="text-xs text-surface-500 mt-0.5">Device → Device</p>
          </div>
        </div>
        <p className="text-sm text-surface-400 leading-relaxed">
          Transfer files directly between browsers using WebRTC. Nothing stored on our servers.
        </p>
      </div>

      {/* ── Body ── */}
      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* Status badge */}
        <div className="flex items-center gap-2 text-xs text-success-500 bg-success-500/10 border border-success-500/20 rounded-lg px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse flex-shrink-0" />
          Direct • Nothing stored • No file size limit
        </div>

        {/* Start button */}
        <button
          onClick={handleCreateSession}
          className="btn-secondary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Start P2P Transfer
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-surface-800" />
          <span className="text-xs text-surface-600 uppercase tracking-widest whitespace-nowrap">or join</span>
          <div className="flex-1 border-t border-surface-800" />
        </div>

        {/* Join form */}
        <form onSubmit={handleJoinSession} className="flex flex-col gap-3" noValidate>
          <div>
            <input
              type="text"
              placeholder="SESSION CODE"
              value={sessionCode}
              onChange={handleCodeChange}
              maxLength={5}
              className={`input text-center text-xl font-bold tracking-[0.4em] uppercase py-3.5 font-mono ${error ? 'input-error' : ''}`}
            />
            {error && (
              <p className="mt-1.5 text-xs text-danger-500 flex items-center justify-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn-outline w-full py-3 flex items-center justify-center gap-2 text-sm"
          >
            Join Session <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default P2PCard;
