const express = require('express');
const { createJob, getAllJobs, getSingleJob, updateJob, deleteJob } = require('../controller/jobs');
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

router.post('/createJob', createJob);
//router.get('/getProjectsSearch', getProjectsSearch);
router.patch('/updateJob/:id', updateJob);
router.get('/getAllJobs', getAllJobs);
router.get('/getSingleJob/:id', getSingleJob);
router.delete('/deleteJob/:id', deleteJob);


module.exports = router;    
