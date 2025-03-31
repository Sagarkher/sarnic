const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');


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


const createDesigner  = async (req, res) => {
    try {
        const { designerName, email, contactNumber, experience, department, status } = req.body;

        // Check if required fields are present
        if (!designerName || !email || !contactNumber || !experience || !department || !status) {
            return res.status(400).json({ status: "false", message: "All fields are required." });
        }

        // Insert into database
        const [result] = await db.query(
            "INSERT INTO designer (designerName, email, contactNumber, experience, department, status) VALUES (?, ?, ?, ?, ?, ?)",
            [designerName, email, contactNumber, experience, department, status]
        );

        // Fetch the inserted project details
        const [newDesigner] = await db.query("SELECT * FROM designer WHERE id = ?", [result.insertId]);

        res.status(201).json({ 
            status: "true", 
            message: "Designer created successfully.", 
            data: newDesigner[0] 
        });

    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Get All Jobs
const getAllDesigner = async (req, res) => {
    try {
        const [designer] = await db.query('SELECT * FROM designer');

        if (designer.length === 0) {
            return res.status(404).json({ status: "false", message: "No designer found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Designer retrieved successfully", data: designer });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
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


const updateDesigner = async (req, res) => {
    try {
        const { id } = req.params;
        const { designerName, email, contactNumber, experience, department, status } = req.body;

        // Check if project exists
        const [existingDesigner] = await db.query("SELECT * FROM designer WHERE id = ?", [id]);
        if (existingDesigner.length === 0) {
            return res.status(404).json({ status: "false", message: "Designer not found." });
        }

        // Update project
        await db.query(
            "UPDATE designer SET designerName = ?, email = ?, contactNumber = ?, experience = ?, department = ?, status = ?  WHERE id = ?",
            [designerName, email, contactNumber, experience, department, status, id]
        );

        // Fetch updated project details
        const [updatedDesigner] = await db.query("SELECT * FROM designer WHERE id = ?", [id]);

        res.status(200).json({
            status: "true",
            message: "Designer updated successfully.",
            data: updatedDesigner[0]  // Send updated job data in response
        });

    } catch (error) {
        console.error("Update Client Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const deleteDesigner = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM designer WHERE id = ?", [id]);

        res.status(200).json({ status: "true", message: "Designer deleted successfully." });

    } catch (error) {
        console.error("Delete designer Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



module.exports = { createDesigner, getAllDesigner, getSingleDesigner, updateDesigner, deleteDesigner };
