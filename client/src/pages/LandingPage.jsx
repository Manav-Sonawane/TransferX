import { Link } from 'react-router-dom';
import { Zap, LayoutDashboard, LogIn, UserPlus, LogOut } from 'lucide-react';
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
    <div className="min-h-screen bg-surface-950 flex flex-col">

      {/* ─── Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-surface-800/60 bg-surface-950/90 backdrop-blur-xl">
        <div className="page-container flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-blue">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-heading font-bold text-base text-white tracking-tight">TransferX</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {user?.name && (
                  <span className="text-xs text-surface-500 hidden sm:block mr-1 max-w-[140px] truncate">
                    {user.name}
                  </span>
                )}
                <Link to="/dashboard" className="btn-ghost btn-sm gap-1.5">
                  <LayoutDashboard size={14} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="btn-outline btn-sm gap-1.5">
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm gap-1.5">
                  <LogIn size={14} />
                  <span className="hidden sm:inline">Login</span>
                </Link>
                <Link to="/register" className="btn-primary btn-sm gap-1.5">
                  <UserPlus size={14} />
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────── */}
      <section className="pt-10 pb-8 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] rounded-full bg-primary-500/5 blur-3xl" />
          <div className="absolute top-0 left-1/3 w-[300px] h-[200px] rounded-full bg-secondary-500/5 blur-3xl" />
        </div>

        <div className="page-container relative">
          <div className="inline-flex items-center gap-2 badge-blue mb-5 text-xs py-1 px-3">
            <Zap size={10} className="text-primary-400" />
            <span>P2P · Cloud Share · Instant Access</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white leading-tight mb-3">
            Move files{' '}
            <span className="gradient-text">your way.</span>
          </h1>
          <p className="text-surface-400 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Transfer directly between devices, share securely with a code,
            or access files you've received — all in one place.
          </p>
        </div>
      </section>

      {/* ─── Three Operation Cards ──────────────────── */}
      <main className="page-container pb-16 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          <P2PCard />
          <ShareCard />
          <AccessCard />
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────── */}
      <footer className="border-t border-surface-800/60 py-5">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-brand flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
            <span className="font-heading font-semibold text-surface-500">TransferX</span>
          </div>
          <p>© 2026 TransferX. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-surface-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-surface-400 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
