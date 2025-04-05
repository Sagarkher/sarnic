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


const createClient  = async (req, res) => {
    try {
        const { clientName, email, contactNumber, companyName, country, industry } = req.body;

        // Check if required fields are present
        if (!clientName || !email || !contactNumber || !companyName || !country || !industry) {
            return res.status(400).json({ status: "false", message: "All fields are required." });
        }

        // Insert into database
        const [result] = await db.query(
            "INSERT INTO clients (clientName, email, contactNumber, companyName, country, industry) VALUES (?, ?, ?, ?, ?, ?)",
            [clientName, email, contactNumber, companyName, country, industry]
        );

        // Fetch the inserted project details
        const [newClient] = await db.query("SELECT * FROM clients WHERE id = ?", [result.insertId]);

        res.status(201).json({ 
            status: "true", 
            message: "Client created successfully.", 
            data: newClient[0] 
        });

    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Get All Jobs
const getAllClient = async (req, res) => {
    try {
        const [client] = await db.query('SELECT * FROM clients');

        if (client.length === 0) {
            return res.status(404).json({ status: "false", message: "No client found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Client retrieved successfully", data: client });
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



const getSingleClient = async (req, res) => {
    try {
        const { id } = req.params;

        const [client] = await db.query('SELECT * FROM clients WHERE id = ?', [id]);

        if (client.length === 0) {
            return res.status(404).json({ status: "false", message: "client not found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Client retrieved successfully", data: client[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { clientName, email, contactNumber, companyName, country, industry } = req.body;

        // Check if project exists
        const [existingProduction] = await db.query("SELECT * FROM clients WHERE id = ?", [id]);
        if (existingProduction.length === 0) {
            return res.status(404).json({ status: "false", message: "Production not found." });
        }

        // Update project
        await db.query(
            "UPDATE clients SET clientName = ?, email = ?, contactNumber = ?, companyName = ?, country = ?, industry = ?  WHERE id = ?",
            [clientName, email, contactNumber, companyName, country, industry, id]
        );

        // Fetch updated project details
        const [updatedClient] = await db.query("SELECT * FROM clients WHERE id = ?", [id]);

        res.status(200).json({
            status: "true",
            message: "Production updated successfully.",
            data: updatedClient[0]  // Send updated job data in response
        });

    } catch (error) {
        console.error("Update Client Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM clients WHERE id = ?", [id]);

        res.status(200).json({ status: "true", message: "Client deleted successfully." });

    } catch (error) {
        console.error("Delete client Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



module.exports = { createClient, getAllClient, getSingleClient, updateClient, deleteClient };
