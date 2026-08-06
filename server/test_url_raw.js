require("dotenv").config();
const cloudinary = require('./src/config/cloudinary');

const url1 = cloudinary.url('test_public_id.txt', {
    resource_type: 'raw',
    secure: true,
    flags: 'attachment:test.txt'
});
console.log('raw with filename:', url1);
