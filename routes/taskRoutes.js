const express = require('express');
const { createTask, getAllTasks, updateTaskStatus, deleteTask } = require('../controller/task');
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

router.post('/createTask', createTask);
router.get('/getAllTasks', getAllTasks);
router.patch('/updateTaskStatus/:id', updateTaskStatus);
router.delete('/deleteTask/:id', deleteTask);


module.exports = router;    
