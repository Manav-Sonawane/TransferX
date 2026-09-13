const multer = require('multer');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024; // 100 MB

const storage = multer.memoryStorage();

// No fileFilter: this is a general-purpose file-sharing app (the UI
// advertises "Any file type"), and multer's `file.mimetype` is just the
// client-supplied Content-Type of the form field — trivially spoofable, so a
// filter keyed on it (as this previously was) blocks nothing a real attacker
// couldn't bypass by relabeling the upload. Real content-type enforcement
// would need server-side magic-byte sniffing, which isn't a stated
// requirement here.
const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

module.exports = upload;
