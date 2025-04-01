const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Cloudinary Config
cloudinary.config({
    cloud_name: 'dkqcqrrbp',  // Your Cloudinary cloud name
    api_key: '418838712271323',  // Your Cloudinary API key
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'  // Your Cloudinary API secret
});

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'task_submissions',  // Cloudinary folder name
        allowed_formats: ['jpg', 'png', 'pdf']  // Allowed file formats
    }
});

// Multer Upload Configuration
const upload = multer({ storage });

module.exports = upload;  // Export the configured multer instance
