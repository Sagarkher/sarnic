const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});


const CreateProjectClient = async (req, res) => {
        try {
            console.log("Request Body:", req.body);
            console.log("Request Files:", req.files);
            const {
                projectName, projectType, priority, startDate, deadline, projectDescription,
                clientName, companyName, email, phoneNumber, businessAddress, additionalNotes
            } = req.body;

            // *✅ Fixing Validation Logic*
            // if (!projectName || !projectType || !priority || !startDate || !deadline || !projectDescription || 
            //     !clientName || !email || !phoneNumber) {
            //     return res.status(400).json({ status: "false", message: "All required fields must be filled." });
            // }

            // Handle file uploads
            let attachmentUrls = [];
            if (req.files && req.files.attachments) {
                try {
                    const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
                    for (let file of files) {
                        const upload = await cloudinary.uploader.upload(file.tempFilePath, {
                            folder: "project_files"
                        });
                        attachmentUrls.push(upload.secure_url);
                    }
                } catch (uploadError) {
                    console.error("File Upload Error:", uploadError);
                    return res.status(500).json({ status: "false", message: "File upload failed." });
                }
            }

            // Insert into database
            try {
                const [result] = await db.query(
                    `INSERT INTO clientprojectscreated 
                    (projectName, projectType, priority, startDate, deadline, projectDescription, 
                    clientName, companyName, email, phoneNumber, businessAddress, additionalNotes, attachments,status ,progress	) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending','10%')`, 
                    [projectName, projectType, priority, startDate, deadline, projectDescription, 
                    clientName, companyName, email, phoneNumber, businessAddress, additionalNotes, JSON.stringify(attachmentUrls)]
                );
                // Fetch the inserted project details
                const [newProject] = await db.query("SELECT * FROM clientprojectscreated WHERE id = ?", [result.insertId]);
                res.status(201).json({
                    status: "true",
                    message: "Project created successfully.",
                    data: newProject[0]
                });
            } catch (dbError) {
                console.error("Database Insert Error:", dbError);
                return res.status(500).json({ status: "false", message: "Database operation failed." });
            }
        } catch (error) {
            console.error("Create Project Error:", error);
            res.status(500).json({ status: "false", message: "Server error." });
        }
    };

const getallaprojects = async (req, res) => {
    try {
        const [projects] = await db.query('SELECT * FROM clientprojectscreated');

        if (projects.length === 0) {
            return res.status(404).json({ status: "false", message: "No projects found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Projects retrieved successfully", data: projects });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
}


const UpdateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Define progress percentage based on status
        let progress;
        switch (status) {
            case "Pending":
                progress = "10%";
                break;
            case "Active":
                progress = "75%";
                break;
            case "Completed":
                progress = "100%";
                break;
            default:
                return res.status(400).json({ status: "false", message: "Invalid status value." });
        }

        // Update status and progress in the database
        const [result] = await db.query(
            "UPDATE clientprojectscreated SET status = ?, progress = ? WHERE id = ?",
            [status, progress, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "false", message: "Project not found." });
        }

        // Fetch updated project details
        const [updatedProject] = await db.query("SELECT * FROM clientprojectscreated WHERE id = ?", [id]);

        res.status(200).json({
            status: "true",
            message: "Project status updated successfully.",
            data: updatedProject[0]
        });

    } catch (error) {
        console.error("Update Project Status Error:", error);
        res.status(500).json({ status: "false", message: "Server error." });
    }
};


const getbyidClientsProjectget = async (req, res) => {
    try {
        const { id } = req.params;

        const [user] = await db.query('SELECT * FROM clientprojectscreated WHERE id = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "client Projects not found", data: [] });
        }

        res.status(200).json({ status: "true", message: "client Projects retrieved successfully", data: user[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = { CreateProjectClient, getallaprojects , UpdateProjectStatus , getbyidClientsProjectget };