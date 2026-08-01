import { useAuth } from '../context/AuthContext';
import { Zap, LogOut, Upload, Share2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Placeholder Dashboard — full version coming in Phase 7
const DashboardPage = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Navbar */}
      <nav className="border-b border-surface-800 bg-surface-900/80 backdrop-blur-xl">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold text-white">TransferX</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-surface-400">
              Hey, <span className="text-white font-medium">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="btn-ghost btn-sm gap-1.5">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="page-container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Dashboard</h1>
          <p className="text-surface-400">Welcome back, {user?.name}! Authentication is working ✅</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {[
            { icon: Upload, label: 'Upload Files', desc: 'Upload & share files securely', to: '/upload', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
            { icon: Share2, label: 'Secure Share', desc: 'Share files with a code', to: '/share', color: 'text-secondary-400', bg: 'bg-secondary-500/10 border-secondary-500/20' },
            { icon: Users, label: 'P2P Transfer', desc: 'Transfer directly between devices', to: '/transfer', color: 'text-success-500', bg: 'bg-success-500/10 border-success-500/20' },
          ].map((item) => (
            <div key={item.label} className={`card-hover p-6 border ${item.bg}`}>
              <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                <item.icon size={22} className={item.color} />
              </div>
              <h3 className="font-heading font-semibold text-white mb-1">{item.label}</h3>
              <p className="text-surface-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="card p-6 border-surface-700">
          <h2 className="font-heading font-semibold text-white mb-3">Phase Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-success-500">✅ Phase 0 — Frontend Setup (Complete)</div>
            <div className="flex items-center gap-2 text-success-500">✅ Phase 1 — Authentication System (Complete)</div>
            <div className="flex items-center gap-2 text-surface-500">⏳ Phase 2 — Database Models (Next)</div>
            <div className="flex items-center gap-2 text-surface-500">⏳ Phase 3 — Cloud Upload</div>
            <div className="flex items-center gap-2 text-surface-500">⏳ Phase 4+5 — Secure Share + Access Mode</div>
            <div className="flex items-center gap-2 text-surface-500">⏳ Phase 6 — P2P Transfer</div>
            <div className="flex items-center gap-2 text-surface-500">⏳ Phase 7+8 — Full Dashboard + File Management</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
