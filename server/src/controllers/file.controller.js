const fileService = require('../services/file.service');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/files/upload
 */
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return sendError(res, 400, 'No file provided');
        }

        const { expiryDays, visibility } = req.body;
        const user = req.user; // from optionalAuth or authenticate middleware

        const file = await fileService.uploadFile({
            user,
            file: req.file,
            expiryDays,
            visibility,
        });

        return sendSuccess(res, 201, 'File uploaded successfully', { file });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/files
 */
const getUserFiles = async (req, res, next) => {
    try {
        const files = await fileService.getUserFiles(req.user.id);
        return sendSuccess(res, 200, 'Files fetched successfully', { files });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/files/:id
 */
const deleteFile = async (req, res, next) => {
    try {
        await fileService.deleteFile(req.params.id, req.user.id);
        return sendSuccess(res, 200, 'File deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadFile,
    getUserFiles,
    deleteFile,
};
