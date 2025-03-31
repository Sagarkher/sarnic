const express = require('express');
const { createClient, getAllClient, getSingleClient, updateClient, deleteClient   } = require('../controller/company');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './upload');  // Specify the folder where images will be stored
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);  // Get file extension
        const fileName = Date.now() + fileExtension;  // Use a unique name
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/createClient', createClient);
router.patch('/updateClient/:id', updateClient);
router.get('/getAllClient', getAllClient);
router.get('/getSingleClient/:id', getSingleClient);
router.delete('/deleteClient/:id', deleteClient);


module.exports = router;    
