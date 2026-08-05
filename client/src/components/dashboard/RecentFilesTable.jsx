import React from 'react';
import { formatBytes } from "../../utils/helpers";
import { Trash2, Download } from 'lucide-react';
import api from "../../services/api.js";
import toast from 'react-hot-toast';

const RecentFilesTable = ({ files, onUpdate }) => {
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this file? This will also delete any active shares.')) {
      try {
        await api.delete(`/files/${id}`);
        toast.success('File deleted successfully');
        if (onUpdate) onUpdate();
      } catch (error) {
        toast.error('Failed to delete file');
      }
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12 border border-surface-800 rounded-2xl bg-surface-900/50">
        <p className="text-surface-400">No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-surface-800 text-surface-400 text-sm">
            <th className="py-3 px-4 font-medium">Name</th>
            <th className="py-3 px-4 font-medium">Size</th>
            <th className="py-3 px-4 font-medium">Type</th>
            <th className="py-3 px-4 font-medium">Uploaded</th>
            <th className="py-3 px-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {files.map(file => (
            <tr key={file.id} className="border-b border-surface-800/50 hover:bg-surface-800/20 transition-colors">
              <td className="py-3 px-4 text-white max-w-[200px] truncate" title={file.name}>
                {file.name}
              </td>
              <td className="py-3 px-4 text-surface-300">{formatBytes(file.size)}</td>
              <td className="py-3 px-4 text-surface-300 truncate max-w-[150px]">{file.type}</td>
              <td className="py-3 px-4 text-surface-300">{new Date(file.createdAt).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-right space-x-2">
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-1.5 text-danger-400 hover:bg-danger-400/10 rounded-lg transition-colors"
                  title="Delete File"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentFilesTable;
