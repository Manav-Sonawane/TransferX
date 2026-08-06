require("dotenv").config();
const cloudinary = require('./src/config/cloudinary');

const urlRaw = cloudinary.url('test_public_id.txt', {
    resource_type: 'raw',
    secure: true,
    flags: 'attachment',
});
console.log('raw:', urlRaw);

const urlImage = cloudinary.url('test_public_id', {
    resource_type: 'image',
    secure: true,
    flags: 'attachment',
    format: 'jpg'
});
console.log('image:', urlImage);
