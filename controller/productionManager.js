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


const createProductionManager  = async (req, res) => {
    try {
        const { managerName, email, contactNumber, department, shiftTiming, experience } = req.body;

        // Check if required fields are present
        if (!managerName || !email || !contactNumber || !department || !shiftTiming || !experience) {
            return res.status(400).json({ status: "false", message: "All fields are required." });
        }

        // Insert into database
        const [result] = await db.query(
            "INSERT INTO productionmanager (managerName, email, contactNumber, department, shiftTiming, experience) VALUES (?, ?, ?, ?, ?, ?)",
            [managerName, email, contactNumber, department, shiftTiming, experience]
        );

        // Fetch the inserted project details
        const [newProductionManager] = await db.query("SELECT * FROM productionmanager WHERE id = ?", [result.insertId]);

        res.status(201).json({ 
            status: "true", 
            message: "Project created successfully.", 
            data: newProductionManager[0] 
        });

    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Get All Jobs
const getAllProductionManager = async (req, res) => {
    try {
        const [production] = await db.query('SELECT * FROM productionmanager');

        if (production.length === 0) {
            return res.status(404).json({ status: "false", message: "No productionmanager found", data: [] });
        }

        res.status(200).json({ status: "true", message: "ProductionManager retrieved successfully", data: production });
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



const getSingleProdutionManager = async (req, res) => {
    try {
        const { id } = req.params;

        const [production] = await db.query('SELECT * FROM productionmanager WHERE id = ?', [id]);

        if (production.length === 0) {
            return res.status(404).json({ status: "false", message: "production not found", data: [] });
        }

        res.status(200).json({ status: "true", message: "ProductionManager retrieved successfully", data: production[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};



const updateProductionManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { managerName, email, contactNumber, department, shiftTiming, experience } = req.body;

        // Check if project exists
        const [existingProduction] = await db.query("SELECT * FROM productionmanager WHERE id = ?", [id]);
        if (existingProduction.length === 0) {
            return res.status(404).json({ status: "false", message: "Production not found." });
        }

        // Update project
        await db.query(
            "UPDATE productionmanager SET managerName = ?, email = ?, contactNumber = ?, department = ?, shiftTiming = ?, experience = ?  WHERE id = ?",
            [managerName, email, contactNumber, department, shiftTiming, experience, id]
        );

        // Fetch updated project details
        const [updatedProduction] = await db.query("SELECT * FROM productionmanager WHERE id = ?", [id]);

        res.status(200).json({
            status: "true",
            message: "Production updated successfully.",
            data: updatedProduction[0]  // Send updated job data in response
        });

    } catch (error) {
        console.error("Update Production Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const deleteProductionManager = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM productionmanager WHERE id = ?", [id]);

        res.status(200).json({ status: "true", message: "Production deleted successfully." });

    } catch (error) {
        console.error("Delete job Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



const getActiveProjects = async (req, res) => {
    try {
        const [projects] = await db.query(`
            SELECT 
                id, 
                projectName, 
                status,
                startDate, 
                endDate
            FROM projects
            WHERE status IN ('In Progress', 'Planned', 'Active', 'Completed')
        `);

        res.status(200).json({ status: "true", data: projects });
    } catch (error) {
        console.error("Active Projects Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};







module.exports = { createProductionManager, getAllProductionManager, getSingleProdutionManager, updateProductionManager, deleteProductionManager, getActiveProjects };
