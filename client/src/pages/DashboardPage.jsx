import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Upload, Users, FileText, HardDrive, Download, Activity, RefreshCw, Zap, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { formatBytes } from '../utils/helpers';
import NBButton from '../components/ui/NBButton';
import NBCard from '../components/ui/NBCard';
import NBBadge from '../components/ui/NBBadge';

/* ── Sub-components ── */

const NBStatCard = ({ title, value, icon: Icon, accent = 'yellow' }) => {
  const accents = {
    yellow:   { bg: 'var(--nb-yellow)', border: 'var(--nb-border)', text: 'var(--nb-black)' },
    blue:     { bg: 'var(--nb-blue)',   border: 'var(--nb-border)', text: 'white' },
    green:    { bg: 'var(--nb-green)',  border: 'var(--nb-border)', text: 'white' },
    orange:   { bg: 'var(--nb-orange)', border: 'var(--nb-border)', text: 'var(--nb-black)' },
  };
  const a = accents[accent] ?? accents.yellow;

  return (
    <NBCard>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 flex items-center justify-center flex-shrink-0"
            style={{ background: a.bg, border: a.border }}
          >
            <Icon size={20} style={{ color: a.text }} />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{title}</p>
        <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
      </div>
    </NBCard>
  );
};

const FileRow = ({ file, onDelete }) => (
  <div className="flex items-center justify-between py-3" style={{ borderBottom: '2px solid var(--nb-gray)' }}>
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <FileText size={14} style={{ flexShrink: 0 }} />
      <div className="min-w-0">
        <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-heading)' }}>{file.name}</p>
        <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{formatBytes(file.size)}</p>
      </div>
    </div>
    {onDelete && (
      <NBButton variant="danger" size="sm" onClick={() => onDelete(file.id)}>
        Delete
      </NBButton>
    )}
  </div>
);

const ShareRow = ({ share }) => (
  <div className="flex items-center justify-between py-3" style={{ borderBottom: '2px solid var(--nb-gray)' }}>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-bold truncate mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        {share.fileName || 'Unknown file'}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <NBBadge color="black" className="text-xs">{share.code}</NBBadge>
        <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
          {share.downloads} downloads
          {share.limit > 0 ? ` / ${share.limit}` : ''}
        </span>
      </div>
    </div>
    <NBBadge color={!share.isExpired ? 'green' : 'pink'} className="ml-3 flex-shrink-0">
      {!share.isExpired ? 'Active' : 'Expired'}
    </NBBadge>
  </div>
);

/* ── Main page ── */
const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="nb-page">

      {/* ─── Nav ─── */}
      <nav style={{ borderBottom: 'var(--nb-border)', background: 'white' }} className="sticky top-0 z-50">
        <div className="nb-container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center" style={{ background: 'var(--nb-black)' }}>
                <Zap size={15} style={{ color: 'var(--nb-yellow)' }} fill="var(--nb-yellow)" />
              </div>
              <span className="font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>TransferX</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:block" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
              Hey, <strong style={{ color: 'var(--nb-black)' }}>{user?.name}</strong>
            </span>
            <Link to="/">
              <NBButton variant="ghost" size="sm"><Home size={13} /><span className="hidden sm:inline">Home</span></NBButton>
            </Link>
            <NBButton variant="danger" size="sm" onClick={handleLogout}>
              <LogOut size={13} /> <span className="hidden sm:inline">Logout</span>
            </NBButton>
          </div>
        </div>
      </nav>

      <div className="nb-container py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              Dashboard
            </h1>
            <p className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
              Overview of your files and shares
            </p>
          </div>
          <NBButton variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </NBButton>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Upload, label: 'Share Files',    desc: 'Upload & share securely',       to: '/', accent: 'yellow' },
            { icon: Download,label: 'Access Files',  desc: 'Enter a share code',            to: '/', accent: 'green' },
            { icon: Users,   label: 'P2P Transfer', desc: 'Transfer directly between devices', to: '/', accent: 'blue' },
          ].map((item) => (
            <Link to={item.to} key={item.label}>
              <NBCard className="p-5 flex items-start gap-4 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform duration-100" style={{ boxShadow: 'var(--nb-shadow)' }}>
                <div
                  className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                  style={{
                    background: item.accent === 'yellow' ? 'var(--nb-yellow)' : item.accent === 'green' ? 'var(--nb-green)' : 'var(--nb-blue)',
                    border: 'var(--nb-border-thin)',
                  }}
                >
                  <item.icon size={18} color={item.accent === 'yellow' ? 'var(--nb-black)' : 'white'} />
                </div>
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{item.label}</h3>
                  <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{item.desc}</p>
                </div>
              </NBCard>
            </Link>
          ))}
        </div>

        {/* Loading */}
        {loading && !data && (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={32} className="animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>Loading...</p>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Stats grid */}
            <div className="grid md:grid-cols-4 gap-4 mb-10">
              <NBStatCard title="Files Uploaded"  value={data.stats.totalFiles}              icon={FileText}  accent="yellow" />
              <NBStatCard title="Storage Used"    value={formatBytes(data.stats.storageUsed || 0)} icon={HardDrive} accent="blue" />
              <NBStatCard title="Active Shares"   value={data.stats.totalActiveShares}        icon={Activity}  accent="green" />
              <NBStatCard title="Total Downloads" value={data.stats.totalDownloads}           icon={Download}  accent="orange" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Files */}
              <NBCard>
                <div className="nb-card-header-black">
                  <div className="flex items-center gap-2">
                    <FileText size={14} color="white" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-mono)' }}>Recent Files</span>
                  </div>
                  <NBBadge color="yellow">Last 5</NBBadge>
                </div>
                <div className="p-5">
                  {data.recentFiles?.length > 0 ? (
                    data.recentFiles.map((f) => <FileRow key={f.id || f._id} file={f} />)
                  ) : (
                    <p className="text-xs text-center py-6" style={{ fontFamily: 'var(--font-mono)', color: '#9ca3af' }}>No files yet</p>
                  )}
                </div>
              </NBCard>

              {/* Active Shares */}
              <NBCard>
                <div className="nb-card-header-black">
                  <div className="flex items-center gap-2">
                    <Activity size={14} color="white" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-mono)' }}>Active Shares</span>
                  </div>
                  <NBBadge color="yellow">Last 5</NBBadge>
                </div>
                <div className="p-5">
                  {data.recentShares?.length > 0 ? (
                    data.recentShares.map((s, i) => <ShareRow key={s._id || i} share={s} />)
                  ) : (
                    <p className="text-xs text-center py-6" style={{ fontFamily: 'var(--font-mono)', color: '#9ca3af' }}>No active shares</p>
                  )}
                </div>
              </NBCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
