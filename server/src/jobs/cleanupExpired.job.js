const cron = require('node-cron');
const File = require('../models/File');
const Share = require('../models/Share');
const { deleteFromCloudinary } = require('../storage/cloudinaryStorage');

const CRON_SCHEDULE = '0 * * * *'; // hourly

/**
 * Expired files were previously only ever blocked at the API layer — nothing
 * deleted the underlying Cloudinary asset or the MongoDB rows, so storage
 * (and the Cloudinary bill) grew without bound. This purges each expired
 * file's Cloudinary asset, its Share links, and the File document itself.
 */
const cleanupExpiredFiles = async () => {
    const expiredFiles = await File.find({ expiry: { $lte: new Date() } });
    let deletedShares = 0;

    for (const file of expiredFiles) {
        try {
            await deleteFromCloudinary(file.publicId, file.resourceType);
            const { deletedCount } = await Share.deleteMany({ fileId: file._id });
            deletedShares += deletedCount;
            await file.deleteOne();
        } catch (error) {
            console.error(`[Cleanup] Failed to purge expired file ${file._id}:`, error);
        }
    }

    return { files: expiredFiles.length, shares: deletedShares };
};

/**
 * A share's own expiry can fall before its file's expiry (createShare caps it
 * to whichever is sooner), so shares also need independent cleanup. No
 * Cloudinary asset is tied to a Share row, so this is a plain delete.
 */
const cleanupExpiredShares = async () => {
    const { deletedCount } = await Share.deleteMany({ expiry: { $lte: new Date() } });
    return deletedCount;
};

const runCleanupSweep = async () => {
    const { files, shares: sharesFromFiles } = await cleanupExpiredFiles();
    const sharesFromExpiry = await cleanupExpiredShares();
    const totalShares = sharesFromFiles + sharesFromExpiry;

    if (files || totalShares) {
        console.log(`[Cleanup] Purged ${files} expired file(s) and ${totalShares} expired share(s)`);
    }

    return { files, shares: totalShares };
};

const startExpiredCleanupJob = () => {
    cron.schedule(CRON_SCHEDULE, () => {
        runCleanupSweep().catch((error) => {
            console.error('[Cleanup] Expired-content sweep failed:', error);
        });
    });
    console.log(`[Cleanup] Expired-content cleanup job scheduled (${CRON_SCHEDULE})`);
};

module.exports = { startExpiredCleanupJob, runCleanupSweep };
