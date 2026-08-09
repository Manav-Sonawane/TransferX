import { Link } from 'react-router-dom';
import { LayoutDashboard, LogIn, UserPlus, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import P2PCard from '../components/home/P2PCard';
import ShareCard from '../components/home/ShareCard';
import AccessCard from '../components/home/AccessCard';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="nb-page flex flex-col">

      {/* ─── Header — GREEN ────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'var(--nb-green)', borderBottom: 'var(--nb-border)' }}
      >
        <div className="nb-container flex items-center justify-between h-14">

          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--nb-black)', border: '2px solid rgba(255,255,255,0.5)' }}
            >
              <Zap size={16} color="var(--nb-yellow)" fill="var(--nb-yellow)" />
            </div>
            <span
              className="text-lg font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-heading)', color: 'white' }}
            >
              TransferX
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {user?.name && (
                  <span
                    className="text-xs font-bold hidden sm:block mr-1 max-w-[140px] truncate"
                    style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}
                  >
                    {user.name}
                  </span>
                )}
                <Link to="/dashboard">
                  <button
                    className="nb-btn nb-btn-sm"
                    style={{ background: 'rgba(0,0,0,0.25)', color: 'white', border: '2px solid rgba(255,255,255,0.6)' }}
                  >
                    <LayoutDashboard size={13} />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                </Link>
                <button
                  className="nb-btn nb-btn-sm"
                  style={{ background: 'var(--nb-black)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}
                  onClick={handleLogout}
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button
                    className="nb-btn nb-btn-sm"
                    style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.6)' }}
                  >
                    <LogIn size={13} /> <span className="hidden sm:inline">Login</span>
                  </button>
                </Link>
                <Link to="/register">
                  <button
                    className="nb-btn nb-btn-sm"
                    style={{ background: 'var(--nb-yellow)', color: 'var(--nb-black)', border: 'var(--nb-border)' }}
                  >
                    <UserPlus size={13} /> Get Started
                  </button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ─── Hero — text white for red bg ─────────── */}
      <section className="nb-container pt-10 pb-8">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-widest mb-5"
          style={{
            background: 'var(--nb-yellow)',
            border: 'var(--nb-border)',
            boxShadow: 'var(--nb-shadow-sm)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--nb-black)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
          WEBRTC POWERED · P2P READY
        </div>

        {/* Display headline — white on red */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mb-4"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'white', textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}
        >
          Move files{' '}
          <span
            className="inline-block px-3 py-1"
            style={{ background: 'var(--nb-yellow)', border: 'var(--nb-border)', boxShadow: 'var(--nb-shadow-sm)', color: 'var(--nb-black)', textShadow: 'none' }}
          >
            your way.
          </span>
        </h1>

        {/* Subtext — white on red */}
        <p
          className="text-base max-w-xl leading-relaxed font-medium"
          style={{ color: 'rgba(255,255,255,0.9)', textShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}
        >
          Transfer directly between devices.
          Share securely with a code.
          Access files when you need them.
        </p>
      </section>

      {/* ─── Three Operation Cards ───────────────── */}
      <main className="nb-container pb-16 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          <P2PCard />
          <ShareCard />
          <AccessCard />
        </div>
      </main>

      {/* ─── Footer — BLUE ───────────────────────── */}
      <footer
        className="py-5"
        style={{ background: 'var(--nb-blue)', borderTop: 'var(--nb-border)' }}
      >
        <div className="nb-container flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center"
              style={{ background: 'var(--nb-black)', border: '2px solid rgba(255,255,255,0.4)' }}
            >
              <Zap size={12} color="var(--nb-yellow)" fill="var(--nb-yellow)" />
            </div>
            <span
              className="text-xs font-bold uppercase tracking-wider text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              TransferX
            </span>
          </div>
          <p className="text-xs text-white/80" style={{ fontFamily: 'var(--font-mono)' }}>© 2026 TransferX.</p>
          <div className="flex gap-4 text-xs text-white/80" style={{ fontFamily: 'var(--font-mono)' }}>
            <a href="#" className="hover:text-white hover:underline transition-colors">Privacy</a>
            <a href="#" className="hover:text-white hover:underline transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
