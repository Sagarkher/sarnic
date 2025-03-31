const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {submitTask, getTaskSubmission, getTaskSubmissionById} = require("../controller/submitTask.js");
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





router.post("/", upload.single("upload_file"), submitTask);
router.get("/:user_id",getTaskSubmission)
router.get("/:user_id/:id", getTaskSubmissionById)
//router.post("/uploadCSV", upload.single("upload_file"), uploadCSV);
module.exports = router;
