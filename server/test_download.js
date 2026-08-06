require("dotenv").config();
const cloudinary = require('./src/config/cloudinary');

const url = cloudinary.utils.api_download_url('test_public_id', {
    resource_type: 'raw',
    attachment: true
});
console.log(url);
