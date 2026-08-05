import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, LogOut, Upload, Share2, Users, FileText, HardDrive, Download, Activity, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from "../services/api.js";
import StatCard from '../components/dashboard/StatCard';
import RecentFilesTable from '../components/dashboard/RecentFilesTable';
import ActiveSharesTable from '../components/dashboard/ActiveSharesTable';
import { formatBytes } from '../utils/helpers';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
            <Link to="/" className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </Link>
            <Link to="/" className="font-heading font-bold text-white">TransferX</Link>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Dashboard</h1>
            <p className="text-surface-400">Overview of your files and shares</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-secondary btn-sm gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {[
            { icon: Upload, label: 'Upload Files', desc: 'Upload & share files securely', to: '/upload', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
            { icon: Share2, label: 'Secure Share', desc: 'Share files with a code', to: '/share', color: 'text-secondary-400', bg: 'bg-secondary-500/10 border-secondary-500/20' },
            { icon: Users, label: 'P2P Transfer', desc: 'Transfer directly between devices', to: '/p2p', color: 'text-success-500', bg: 'bg-success-500/10 border-success-500/20' },
          ].map((item) => (
            <Link to={item.to} key={item.label} className={`card-hover p-6 border ${item.bg}`}>
              <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                <item.icon size={22} className={item.color} />
              </div>
              <h3 className="font-heading font-semibold text-white mb-1">{item.label}</h3>
              <p className="text-surface-400 text-sm">{item.desc}</p>
            </Link>
          ))}
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin text-primary-500">
              <RefreshCw size={32} />
            </div>
          </div>
        ) : data && (
          <>
            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-5 mb-10">
              <StatCard
                title="Files Uploaded"
                value={data.stats.totalFiles}
                icon={FileText}
                color="text-primary-400"
                bg="bg-primary-500/10 border-primary-500/20"
              />
              <StatCard
                title="Storage Used"
                value={formatBytes(data.stats.storageUsed || 0)}
                icon={HardDrive}
                color="text-secondary-400"
                bg="bg-secondary-500/10 border-secondary-500/20"
              />
              <StatCard
                title="Active Shares"
                value={data.stats.totalActiveShares}
                icon={Activity}
                color="text-success-500"
                bg="bg-success-500/10 border-success-500/20"
              />
              <StatCard
                title="Total Downloads"
                value={data.stats.totalDownloads}
                icon={Download}
                color="text-warning-400"
                bg="bg-warning-500/10 border-warning-500/20"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Files */}
              <div className="card p-6 border-surface-800">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-bold text-lg text-white">Recent Files</h2>
                  {/* Link to full file management in Phase 8 */}
                  <span className="text-xs font-medium px-2 py-1 bg-surface-800 text-surface-300 rounded-md">Last 5 files</span>
                </div>
                <RecentFilesTable files={data.recentFiles} onUpdate={fetchDashboardData} />
              </div>

              {/* Active Shares */}
              <div className="card p-6 border-surface-800">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-bold text-lg text-white">Recent Active Shares</h2>
                  <span className="text-xs font-medium px-2 py-1 bg-surface-800 text-surface-300 rounded-md">Last 5 shares</span>
                </div>
                <ActiveSharesTable shares={data.recentShares} onUpdate={fetchDashboardData} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
