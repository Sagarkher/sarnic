// const express = require("express");

// const authMiddleware = require('../middleware/authMiddleware');
// const {submitTask, getTaskSubmission, getTaskSubmissionById} = require("../controller/submitTask.js");
// const multer = require('multer');
// const cloudinary = require("cloudinary").v2;
// const path = require('path');


// const router = express.Router();
// const storage = multer.memoryStorage();
// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
// });




// router.post("/submitTask", upload.single("file"), submitTask);



// router.get("/:user_id",getTaskSubmission)
// router.get("/:user_id/:id", getTaskSubmissionById)
// //router.post("/uploadCSV", upload.single("upload_file"), uploadCSV);
// module.exports = router;




const express = require('express');
const {submitTask} = require("../controller/submit.js");
const upload = require('../middleware/uploadMiddleware'); // Import the multer config
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
//const upload = multer({ storage: storage });

const router = express.Router();

router.post("/submitTask", submitTask);
// router.post('/CreateProjectClient', CreateProjectClient);
// router.get('/getallaprojects', getallaprojects);
// router.put('/UpdateProjectStatus/:id', UpdateProjectStatus);
// router.get('/getbyidClientsProjectget/:id', getbyidClientsProjectget);

module.exports = router; 



