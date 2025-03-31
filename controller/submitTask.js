// veni 
const fs = require("fs");
const db = require('../config');
const path = require('path');
//const fastCsv = require("@fast-csv/parse");

const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});



// const submitTask = async (req, res) => {
//     try {

//         const { task_id, comments, user_id } = req.body;

//         if (!task_id || !user_id) {
//             return res.status(422).json({ message: "Task ID and User ID are required" });
//         }

//         let image = "";
//         if (req.file) {
//             image = `http://127.0.0.1:5008/upload/${req.file.filename}`;
//         }

//         const data = { task_id, upload_file: image, comments, user_id };

//         const sql = 'INSERT INTO task_submission SET ?';
//         const [result] = await db.query(sql, [data]);

//         if (result.affectedRows > 0) {
//             return res.status(200).json({ message: "Task Submitted Successfully" });
//         } else {
//             return res.status(500).json({ message: "Failed to submit task" });
//         }
//     } catch (error) {
//         return res.status(500).json({ error: error.message });
//     }
// };



const submitTask = async (req, res) => {
    try {
        const { task_id, comments, user_id } = req.body;

        if (!task_id || !user_id) {
            return res.status(422).json({ message: "Task ID and User ID are required" });
        }

        let imageUrls = []; // ✅ Store multiple image URLs

        if (req.files && req.files.image) {
            const images = Array.isArray(req.files.image) ? req.files.image : [req.files.image];

            for (let file of images) {
                const imageUpload = await cloudinary.uploader.upload(file.tempFilePath, {
                    folder: "task_submissions"
                });
                imageUrls.push(imageUpload.secure_url); // ✅ Store uploaded image URL
            }
        }

        const data = { 
            task_id, 
            upload_file: JSON.stringify(imageUrls), // ✅ Store as JSON string in DB
            comments, 
            user_id 
        };

        const sql = 'INSERT INTO task_submission SET ?';
        const [result] = await db.query(sql, [data]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ 
                message: "Task Submitted Successfully", 
                file_urls: imageUrls 
            });
        } else {
            return res.status(500).json({ message: "Failed to submit task" });
        }
    } catch (error) {
        console.error("Submit Task Error:", error);
        return res.status(500).json({ error: error.message });
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