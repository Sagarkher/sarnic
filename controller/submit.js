// veni 
const fs = require("fs");
const db = require('../config');
const multer = require("multer");
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

//const fastCsv = require("@fast-csv/parse");

const cloudinary = require('cloudinary').v2;
// ✅ Multer Configuration for Storing Files Temporarily
//const storage = multer.diskStorage({});


// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});

// ✅ Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'task_submissions',  // Folder name on Cloudinary
        allowed_formats: ['jpg', 'png', 'pdf']  // Allowed formats for upload
    }
});

const upload = multer({ storage });



const submitTask = async (req, res) => {
    try {
        console.log("Request Body:", req.body);
        console.log("Uploaded File:", req.files); // ✅ Log to check file

        const { task_id, comments, user_id } = req.body;

        if (!task_id || !user_id) {
            return res.status(400).json({ status: "false", message: "task_id and user_id are required." });
        }

        let submitFileUrl = ""; // Default empty

        if (req.files && req.files.submitFile) {  // ✅ Corrected field name
            const file = req.files.submitFile;

            console.log("Uploading to Cloudinary...");

            // ✅ Upload to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
                folder: "task_submissions",
                resource_type: "auto"
            });

            console.log("Cloudinary Upload Result:", uploadResult);

            submitFileUrl = uploadResult.secure_url; // ✅ Store URL
        } else {
            console.log("No file found in request!");
        }

        // ✅ Save in Database
        const [result] = await db.query(
            `INSERT INTO task_submission (task_id, submitFile, comments, user_id) VALUES (?, ?, ?, ?)`,
            [task_id, submitFileUrl, comments || "", user_id]
        );

        // ✅ Fetch new record
        const [newSubmission] = await db.query("SELECT * FROM task_submission WHERE id = ?", [result.insertId]);

        res.status(201).json({
            status: "true",
            message: "Task submission created successfully.",
            data: newSubmission[0]
        });

    } catch (error) {
        console.error("Create Task Submission Error:", error);
        res.status(500).json({ status: "false", message: "Server error." });
    }
};


const getTaskSubmission = async (req, res) => {
    try {
        const {user_id} = req.params;
        const sql = 'SELECT * FROM task_submission WHERE user_id =?';
        const [result] = await db.query(sql,[user_id]);

        if (result.length > 0) {
            return res.status(200).json({message: "Task fetch Successfully by User.", data: result });
        } else {
            return res.status(404).json({ message: "No task submissions found" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


const getTaskSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM task_submission WHERE id =?';
        const [result] = await db.query(sql, [id]);

        if (result.length > 0) {
            return res.status(200).json({ message: "Task fetch successfully. ", data: result });
        } else {
            return res.status(404).json({ message: "No task submissions found" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


// const uploadCSV = async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: "No file uploaded" });
//     }

//     const filePath = req.file.path;
//     let rows = [];

//     fs.createReadStream(filePath)
//         .pipe(fastCsv.parse({ headers: true }))
//         .on("data", (row) => {
//             rows.push([
//                 row.Item,
//                 row["Brand Name"],
//                 row["Sub Brand"],
//                 row.Flavour,
//                 row["Pack Type"],
//                 row["Pack Size"],
//                 row["Pack Code"],
//                 row.Barcode,
//                 row.Priority,
//                 row["3D"],
//                 row.PDF,
//                 row.Links,
//                 row.Upload,
//                 row.Action,
//             ]);
//         })
//         .on("end", async () => {
//             try {
//                 if (!pool) {
//                     console.error("Database pool is not initialized!");
//                     return res.status(500).json({ error: "Database connection issue" });
//                 }

//                 const query = `
//                     INSERT INTO test_data (
//                         Item, Brand_Name, Sub_Brand, Flavour, Pack_Type, Pack_Size, 
//                         Pack_Code, Barcode, Priority, ThreeD, PDF, Links, Upload, Action
//                     ) VALUES ?`;

//                 const [result] = await pool.query(query, [rows]);

//                 res.status(200).json({
//                     message: "CSV uploaded successfully",
//                     insertedRows: result.affectedRows,
//                 });
//             } catch (error) {
//                 console.error("Database Error:", error);
//                 res.status(500).json({ error: error.message });
//             }
//         })
//         .on("error", (error) => {
//             console.error("CSV Parsing Error:", error);
//             res.status(500).json({ error: "CSV Parsing Error" });
//         });
// };


module.exports ={submitTask, getTaskSubmission, getTaskSubmissionById}