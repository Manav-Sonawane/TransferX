const File = require('../models/File');
const Share = require('../models/Share');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Files Uploaded & Storage Used
    const files = await File.find({ owner: userId }).sort({ createdAt: -1 });
    const totalFiles = files.length;
    const storageUsed = files.reduce((acc, file) => acc + (file.size || 0), 0);
    const recentFiles = files.slice(0, 5);

    // 2. Active Shares & Downloads
    // A share belongs to a file which belongs to the user.
    // First, find all file IDs owned by the user.
    const fileIds = files.map(f => f._id);
    
    const shares = await Share.find({ fileId: { $in: fileIds } })
      .populate('fileId', 'originalName size storageUrl')
      .sort({ createdAt: -1 });
      
    // Filter out expired shares to get active ones
    const activeShares = shares.filter(share => !share.isExpired());
    const totalActiveShares = activeShares.length;
    
    // Sum all downloads across all shares
    const totalDownloads = shares.reduce((acc, share) => acc + (share.downloadCount || 0), 0);
    const recentShares = shares.slice(0, 5);

    res.json({
      stats: {
        totalFiles,
        storageUsed,
        totalDownloads,
        totalActiveShares
      },
      recentFiles: recentFiles.map(f => ({
        id: f._id,
        name: f.originalName,
        size: f.size,
        type: f.mimeType,
        createdAt: f.createdAt
      })),
      recentShares: recentShares.map(s => ({
        id: s._id,
        code: s.shareCode,
        fileId: s.fileId?._id,
        fileName: s.fileId?.originalName,
        downloads: s.downloadCount,
        limit: s.downloadLimit,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        isExpired: s.isExpired()
      }))
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard statistics' });
  }
};
