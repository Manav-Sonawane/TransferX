import React from 'react';
import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from "../../services/api.js";

const ActiveSharesTable = ({ shares, onUpdate }) => {
  const handleCopy = (code) => {
    const link = `${window.location.origin}/share/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Share link copied!');
  };

  if (!shares || shares.length === 0) {
    return (
      <div className="text-center py-12 border border-surface-800 rounded-2xl bg-surface-900/50">
        <p className="text-surface-400">No active shares found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-surface-800 text-surface-400 text-sm">
            <th className="py-3 px-4 font-medium">Code</th>
            <th className="py-3 px-4 font-medium">File</th>
            <th className="py-3 px-4 font-medium">Downloads</th>
            <th className="py-3 px-4 font-medium">Expires</th>
            <th className="py-3 px-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {shares.map(share => (
            <tr key={share.id} className="border-b border-surface-800/50 hover:bg-surface-800/20 transition-colors">
              <td className="py-3 px-4 font-mono text-primary-400 font-medium">
                {share.code}
              </td>
              <td className="py-3 px-4 text-white max-w-[200px] truncate" title={share.fileName}>
                {share.fileName || 'Unknown File'}
              </td>
              <td className="py-3 px-4 text-surface-300">
                {share.downloads} / {share.limit || '∞'}
              </td>
              <td className="py-3 px-4 text-surface-300">
                {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : 'Never'}
              </td>
              <td className="py-3 px-4 text-right space-x-2">
                <button
                  onClick={() => handleCopy(share.code)}
                  className="p-1.5 text-surface-300 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
                  title="Copy Link"
                >
                  <Copy size={16} />
                </button>
                <Link
                  to={`/share/${share.code}`}
                  className="p-1.5 text-surface-300 hover:text-primary-400 hover:bg-primary-400/10 rounded-lg transition-colors inline-block"
                  title="Visit Link"
                >
                  <ExternalLink size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveSharesTable;
