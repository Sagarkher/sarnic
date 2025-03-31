const express = require('express');
const { createDesigner, getAllDesigner, getSingleDesigner, updateDesigner, deleteDesigner } = require('../controller/designer');
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

router.post('/createDesigner', createDesigner);
router.patch('/updateDesigner/:id', updateDesigner);
router.get('/getAllDesigner', getAllDesigner);
router.get('/getSingleDesigner/:id', getSingleDesigner);
router.delete('/deleteDesigner/:id', deleteDesigner);


module.exports = router;    
