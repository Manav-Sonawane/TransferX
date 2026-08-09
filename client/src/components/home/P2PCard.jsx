import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Plus, ArrowRight } from 'lucide-react';
import NBCard from '../ui/NBCard';
import NBButton from '../ui/NBButton';
import NBCodeInput from '../ui/NBCodeInput';
import NBBadge from '../ui/NBBadge';

const P2PCard = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (!sessionCode) { setCodeError('Enter a session code'); return; }
    if (sessionCode.length !== 5) { setCodeError('Code must be 5 characters'); return; }
    navigate(`/p2p/${sessionCode}`);
  };

  const handleChange = (val) => {
    setSessionCode(val);
    if (codeError) setCodeError('');
  };

  return (
    <NBCard className="flex flex-col">
      {/* ── Header strip ── */}
      <div className="nb-card-header-blue">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center border-[2px] border-white/60 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Network size={18} color="white" />
          </div>
          <div>
            <h2 className="font-bold text-base uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              P2P Transfer
            </h2>
            <p className="text-xs text-white/70 font-bold uppercase tracking-widest mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
              Device → Device
            </p>
          </div>
        </div>
        <NBBadge color="white" className="hidden sm:inline-flex text-xs">WebRTC</NBBadge>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">
          Transfer directly between browsers. Nothing stored on our servers — no file size limit.
        </p>

        {/* Status */}
        <NBBadge color="green" className="self-start">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
          DIRECT · NO SERVER · UNLIMITED
        </NBBadge>

        {/* Start button */}
        <NBButton
          variant="blue"
          className="w-full"
          onClick={() => navigate('/p2p/new')}
        >
          <Plus size={16} />
          Start P2P Transfer
        </NBButton>

        {/* Divider */}
        <div className="nb-divider text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
          OR JOIN
        </div>

        {/* Code input + join */}
        <form onSubmit={handleJoin} className="flex flex-col gap-3" noValidate>
          <NBCodeInput
            id="p2p-session-code"
            value={sessionCode}
            onChange={handleChange}
            error={codeError}
            placeholder="XXXXX"
            label="Session Code"
          />
          <NBButton type="submit" variant="ghost" className="w-full">
            Join Session <ArrowRight size={15} />
          </NBButton>
        </form>
      </div>
    </NBCard>
  );
};

export default P2PCard;
