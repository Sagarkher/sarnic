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


const createProject = async (req, res) => {
    try {
        const { projectName, projectNumber, clientId, startDate, endDate, status, description } = req.body;

        // Check if required fields are present
        if (!projectName || !projectNumber || !clientId || !startDate || !endDate || !status) {
            return res.status(400).json({ status: "false", message: "All fields are required." });
        }

        // Insert into database
        const [result] = await db.query(
            "INSERT INTO projects (projectName, projectNumber, clientId, startDate, endDate, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [projectName, projectNumber, clientId, startDate, endDate, status, description]
        );

        // Fetch the inserted project details
        const [newProject] = await db.query("SELECT * FROM projects WHERE id = ?", [result.insertId]);

        res.status(201).json({ 
            status: "true", 
            message: "Project created successfully.", 
            data: newProject[0] 
        });

    } catch (error) {
        console.error("Create Project Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Get All Projects
const getAllProjects = async (req, res) => {
    try {
        const [projects] = await db.query('SELECT p.*, c.clientName FROM projects p JOIN clients c ON p.clientId = c.id');

        if (projects.length === 0) {
            return res.status(404).json({ status: "false", message: "No projects found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Projects retrieved successfully", data: projects });
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



const getSingleProject = async (req, res) => {
    try {
        const { id } = req.params;

        const [project] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);

        if (project.length === 0) {
            return res.status(404).json({ status: "false", message: "projects not found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Projects retrieved successfully", data: project[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};



const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName, projectNumber, clientId, startDate, endDate, status, description } = req.body;

        // Check if project exists
        const [existingProject] = await db.query("SELECT * FROM projects WHERE id = ?", [id]);
        if (existingProject.length === 0) {
            return res.status(404).json({ status: "false", message: "Project not found." });
        }

        // Update project
        await db.query(
            "UPDATE projects SET projectName = ?, projectNumber = ?, clientId = ?, startDate = ?, endDate = ?, status = ?, description = ? WHERE id = ?",
            [projectName, projectNumber, clientId, startDate, endDate, status, description, id]
        );

        // Fetch updated project details
        const [updatedProject] = await db.query("SELECT * FROM projects WHERE id = ?", [id]);

        res.status(200).json({
            status: "true",
            message: "Project updated successfully.",
            data: updatedProject[0]  // Send updated project data in response
        });

    } catch (error) {
        console.error("Update Project Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM projects WHERE id = ?", [id]);

        res.status(200).json({ status: "true", message: "Project deleted successfully." });

    } catch (error) {
        console.error("Delete Project Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};






module.exports = { createProject, getAllProjects, getSingleProject, updateProject, deleteProject };
