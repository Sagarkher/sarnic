const express = require('express');
const { createProject, getAllProjects, getSingleProject, updateProject, deleteProject, getSingleJob } = require('../controller/project');
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

router.post('/createProject', createProject);
//router.get('/getProjectsSearch', getProjectsSearch);
router.patch('/updateProject/:id', updateProject);
router.get('/getAllProjects', getAllProjects);
router.get('/getSingleProject/:id', getSingleProject);
router.delete('/deleteProject/:id', deleteProject);


module.exports = router;    
