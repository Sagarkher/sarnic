const express = require('express');
const { createProductionManager, getAllProductionManager, getSingleProdutionManager, updateProductionManager, deleteProductionManager, getActiveProjects } = require('../controller/productionManager');
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

router.post('/createProductionManager', createProductionManager);
router.patch('/updateProductionManager/:id', updateProductionManager);
router.get('/getAllProductionManager', getAllProductionManager);
router.get('/getSingleProdutionManager/:id', getSingleProdutionManager);
router.delete('/deleteProductionManager/:id', deleteProductionManager);
router.get('/getActiveProjects', getActiveProjects);


module.exports = router;    
