const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});



// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, './upload');  // Specify the folder where images will be stored
//     },
//     filename: (req, file, cb) => {
//         const fileExtension = path.extname(file.originalname);  // Get file extension
//         const fileName = Date.now() + fileExtension;  // Use a unique name
//         cb(null, fileName);
//     }
// });

// const upload = multer({ storage: storage });



//old code 
// const createTask  = async (req, res) => {
//     try {
//         const { projectId, taskName, assignTo, deadline, status } = req.body;

//         // Check if required fields are present
//         if (!projectId || !taskName || !assignTo || !deadline || !status) {
//             return res.status(400).json({ status: "false", message: "All fields are required." });
//         }

//         // Insert into database
//         const [result] = await db.query(
//             "INSERT INTO tasks (projectId, taskName, assignTo, deadline, status) VALUES (?, ?, ?, ?, ?)",
//             [projectId, taskName, assignTo, deadline, status]
//         );

//         // Fetch the inserted project details
//         const [newTask] = await db.query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);

//         res.status(201).json({ 
//             status: "true", 
//             message: "Tasks created successfully.", 
//             data: newTask[0] 
//         });

//     } catch (error) {
//         console.error("Create Task Error:", error);
//         res.status(500).json({ status: "false", message: "Server error" });
//     }
// };


//new code 


const createTask = async (req, res) => {
    try {
        const { 
            projectId, taskName, assignTo, startDate, endDate, 
            privacy, progress, followers, remainders, 
            description 
        } = req.body;

        // Validate required fields
        if (!projectId || !taskName || !assignTo || !startDate || !endDate) {
            return res.status(400).json({ status: "false", message: "All required fields must be filled." });
        }

        // Handle file attachment
        let fileUrl = ""; // Default file URL is empty

        if (req.files && req.files.file) {
            const fileUpload = await cloudinary.uploader.upload(req.files.file.tempFilePath, {
                folder: "task_files/file",
                resource_type: "auto",
            });
            fileUrl = fileUpload.secure_url; // Corrected property name
        }

        console.log("Final File URL:", fileUrl);

        // Insert into database
        const [result] = await db.query(
            `INSERT INTO tasks 
            (projectId, taskName, assignTo, startDate, endDate, privacy, progress, followers, file, remainders, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [projectId, taskName, assignTo, startDate, endDate, privacy, progress, followers, fileUrl, remainders, description]
        );

        // Fetch the inserted task details
        const [newTask] = await db.query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);

        res.status(201).json({ 
            status: "true", 
            message: "Task created successfully.", 
            data: newTask[0] 
        });

    } catch (error) {
        console.error("Create Task Error:", error);
        res.status(500).json({ status: "false", message: "Server error", error: error.message });
    }
};



// Get All Jobs
const getAllTasks = async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT 
                t.id, 
                p.projectName, 
                t.taskName, 
                u.name AS assignTo, 
                t.endDate AS endDate,
                t.status
            FROM tasks t
            LEFT JOIN projects p ON t.projectId = p.id
            LEFT JOIN users u ON t.assignTo = u.id
            ORDER BY t.endDate ASC
        `);

        res.status(200).json({ status: "true", data: tasks });
    } catch (error) {
        console.error("Get Tasks Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


// const getProjects = async (req, res) => {
//     try {
//         const [projects] = await db.query(`
//             SELECT p.*, c.client_name 
//             FROM projects p 
//             JOIN clients c ON p.client_id = c.id
//         `);

//         res.status(200).json({ status: "true", data: projects });

//     } catch (error) {
//         console.error("Fetch Projects Error:", error);
//         res.status(500).json({ status: "false", message: "Server error" });
//     }
// };


const getSingleDesigner = async (req, res) => {
    try {
        const { id } = req.params;

        const [designer] = await db.query('SELECT * FROM designer WHERE id = ?', [id]);

        if (designer.length === 0) {
            return res.status(404).json({ status: "false", message: "designer not found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Designer retrieved successfully", data: designer[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};



const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ status: "false", message: "Status is required" });
        }

        // Update task status
        await db.query(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id]);

        // Fetch updated task data
        const [updatedTask] = await db.query(`SELECT * FROM tasks WHERE id = ?`, [id]);

        res.status(200).json({ 
            status: "true", 
            message: "Task status updated successfully", 
            data: updatedTask[0] // Return updated task details
        });
    } catch (error) {
        console.error("Update Task Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM tasks WHERE id = ?", [id]);

        res.status(200).json({ status: "true", message: "Task deleted successfully." });

    } catch (error) {
        console.error("Delete task Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



module.exports = { createTask, getAllTasks, updateTaskStatus, deleteTask };
