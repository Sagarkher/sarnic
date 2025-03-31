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


// const createJob = async (req, res) => {
//     try {
//         const { jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, brandName, subBrand, flavour, packType, packSize, packCode, barcode, dateCreated, targetDate, description } = req.body;

//         // Check if required fields are present
//         if (!jobName || !jobNumber || !clientId || !projectId || !projectNumber || !jobAssign) {
//             return res.status(400).json({ status: "false", message: "All fields are required." });
//         }

//         // Insert into database
//         const [result] = await db.query(
//             "INSERT INTO jobs (jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, brandName, subBrand, flavour, packType, packSize, packCode, barcode, dateCreated, targetDate, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
//             [jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, brandName, subBrand, flavour, packType, packSize, packCode, barcode, dateCreated, targetDate, description]
//         );

//         // Fetch the inserted project details
//         const [newJob] = await db.query("SELECT * FROM jobs WHERE id = ?", [result.insertId]);

//         res.status(201).json({ 
//             status: "true", 
//             message: "Project created successfully.", 
//             data: newJob[0] 
//         });

//     } catch (error) {
//         console.error("Create Job Error:", error);
//         res.status(500).json({ status: "false", message: "Server error" });
//     }
// };


const createJob = async (req, res) => {
    try {
        console.log("Request Body:", req.body);
        console.log("Request Files:", req.files);
        const {
            jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, 
            brandName, subBrand, flavour, packType, packSize, packCode, fgCode,
            priority, barcode, promotion, description, links 
        } = req.body;

        // Validation
        if (!jobName || !jobNumber || !clientId || !projectId || !projectNumber || !jobAssign ||
            !brandName || !subBrand || !flavour || !packType || !packSize || !packCode || 
            !fgCode || !priority || !barcode || !description || !links) {
            return res.status(400).json({ status: "false", message: "All required fields must be filled." });
        }

        // Handle file uploads
        let instructionFileUrl = "";
        let pdfUrl = "";
        let imageUrls = [];

        if (req.files) {
            if (req.files.instructionFile) {
                const instructionFileUpload = await cloudinary.uploader.upload(req.files.instructionFile.tempFilePath, {
                    folder: "job_files/instructions",
                    resource_type: "auto",
                    //format: "pdf"
                    
                });
                instructionFileUrl = instructionFileUpload.secure_url;
            }
            
            if (req.files.pdf) {
                const pdfUpload = await cloudinary.uploader.upload(req.files.pdf.tempFilePath, {
                    folder: "job_files/pdfs",
                    resource_type: "auto",
                    
                   
                });
                
                pdfUrl = pdfUpload.secure_url;
            }

            if (req.files.image) {
                const images = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
                for (let file of images) {
                    const imageUpload = await cloudinary.uploader.upload(file.tempFilePath, {
                        folder: "job_files/images"
                    });
                    imageUrls.push(imageUpload.secure_url);
                }
            }
        }

        // Insert into database
        const [result] = await db.query(
            `INSERT INTO jobs 
            (jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, brandName, subBrand, flavour, packType, packSize, packCode, fgCode, priority, barcode, promotion, instructionFile, description, links, pdf, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, brandName, subBrand, flavour, packType, packSize, packCode, fgCode, priority, barcode, promotion, instructionFileUrl, description, links, pdfUrl, JSON.stringify(imageUrls)]
        );

        // Fetch the inserted project details
        const [newJob] = await db.query("SELECT * FROM jobs WHERE id = ?", [result.insertId]);

        // ✅ Fix: Parse image field if it's a string
        if (newJob.length > 0 && typeof newJob[0].image === "string") {
            newJob[0].image = JSON.parse(newJob[0].image);
        }

        res.status(201).json({ 
            status: "true", 
            message: "Project created successfully.", 
            data: newJob[0] 
        });
    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



// Get All Jobs
const getAllJobs = async (req, res) => {
    try {
        const [jobs] = await db.query('SELECT j.*, c.clientName FROM jobs j JOIN clients c ON j.clientId = c.id');

        if (jobs.length === 0) {
            return res.status(404).json({ status: "false", message: "No jobs found", data: [] });
        }

        // ✅ Remove the "image" field or parse it correctly
        const formattedJobs = jobs.map(job => ({
            ...job,
            image: job.image ? JSON.parse(job.image) : [] // Convert to array or empty if null
        }));

        res.status(200).json({ status: "true", message: "Projects retrieved successfully", data: formattedJobs });
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



const getSingleJob = async (req, res) => {
    try {
        const { id } = req.params;

        const [job] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);

        if (job.length === 0) {
            return res.status(404).json({ status: "false", message: "jobs not found", data: [] });
        }
        const formattedJobs = job.map(job => ({
            ...job,
            image: job.image ? JSON.parse(job.image) : [] // Convert to array or empty if null
        }));

        res.status(200).json({ status: "true", message: "Job retrieved successfully", data: formattedJobs[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};



// const updateJob = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, brandName, subBrand, flavour, packType, packSize, packCode, barcode, dateCreated, targetDate, description } = req.body;

//         // Check if project exists
//         const [existingProject] = await db.query("SELECT * FROM projects WHERE id = ?", [id]);
//         if (existingProject.length === 0) {
//             return res.status(404).json({ status: "false", message: "Project not found." });
//         }

//         // Update project
//         await db.query(
//             "UPDATE jobs SET jobName = ?, jobNumber = ?, clientId = ?, projectId = ?, projectNumber = ?, jobAssign = ?, brandName = ?, subBrand = ?, flavour = ?, packType = ?, packSize = ?, packCode = ?, barcode = ?, dateCreated = ?, targetDate = ?, description = ?  WHERE id = ?",
//             [jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, brandName, subBrand, flavour, packType, packSize, packCode, barcode, dateCreated, targetDate, description, id]
//         );

//         // Fetch updated project details
//         const [updatedJob] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);

//         res.status(200).json({
//             status: "true",
//             message: "Job updated successfully.",
//             data: updatedJob[0]  // Send updated job data in response
//         });

//     } catch (error) {
//         console.error("Update Project Error:", error);
//         res.status(500).json({ status: "false", message: "Server error" });
//     }
// };



const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            jobName, jobNumber, clientId, projectId, projectNumber, jobAssign,
            brandName, subBrand, flavour, packType, packSize, packCode, fgCode,
            priority, barcode, promotion, description, links
        } = req.body;

        // Check if job exists
        const [existingJob] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);
        if (existingJob.length === 0) {
            return res.status(404).json({ status: "false", message: "Job not found." });
        }

        let instructionFileUrl = existingJob[0].instructionFile || "";
        let pdfUrl = existingJob[0].pdf || "";
        let imageUrls = existingJob[0].image ? JSON.parse(existingJob[0].image) : [];

        if (req.files) {
            if (req.files.instructionFile) {
                const instructionFileUpload = await cloudinary.uploader.upload(req.files.instructionFile.tempFilePath, {
                    folder: "job_files/instructions",
                    resource_type: "auto"
                });
                instructionFileUrl = instructionFileUpload.secure_url;
            }

            if (req.files.pdf) {
                const pdfUpload = await cloudinary.uploader.upload(req.files.pdf.tempFilePath, {
                    folder: "job_files/pdfs",
                    resource_type: "auto"
                });
                pdfUrl = pdfUpload.secure_url;
            }

            if (req.files.image) {
                const images = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
                imageUrls = []; // Reset images for update
                for (let file of images) {
                    const imageUpload = await cloudinary.uploader.upload(file.tempFilePath, {
                        folder: "job_files/images"
                    });
                    imageUrls.push(imageUpload.secure_url);
                }
            }
        }

        // Update job in database
        await db.query(
            `UPDATE jobs 
            SET jobName = ?, jobNumber = ?, clientId = ?, projectId = ?, projectNumber = ?, jobAssign = ?, 
                brandName = ?, subBrand = ?, flavour = ?, packType = ?, packSize = ?, packCode = ?, fgCode = ?, 
                priority = ?, barcode = ?, promotion = ?, instructionFile = ?, description = ?, links = ?, pdf = ?, image = ? 
            WHERE id = ?`,
            [jobName, jobNumber, clientId, projectId, projectNumber, jobAssign, brandName, subBrand, flavour, packType, packSize, packCode, fgCode, priority, barcode, promotion, instructionFileUrl, description, links, pdfUrl, JSON.stringify(imageUrls), id]
        );

        // Fetch updated job
        const [updatedJob] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);

        // Parse image field if it's a string
        if (updatedJob.length > 0 && typeof updatedJob[0].image === "string") {
            updatedJob[0].image = JSON.parse(updatedJob[0].image);
        }

        res.status(200).json({
            status: "true",
            message: "Job updated successfully.",
            data: updatedJob[0]
        });

    } catch (error) {
        console.error("Update Job Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM jobs WHERE id = ?", [id]);

        res.status(200).json({ status: "true", message: "Job deleted successfully." });

    } catch (error) {
        console.error("Delete job Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};







module.exports = { createJob, getAllJobs, getSingleJob, updateJob, deleteJob };
