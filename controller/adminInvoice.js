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


const getInvoice = async (req, res) => {
    try {
        const [jobs] = await db.query(`
            SELECT j.jobNumber, j.brandName, j.subBrand, j.flavour, j.packType, j.packSize, j.packCode, j.barcode,  COALESCE(c.clientName, '') AS clientName, COALESCE(p.status, '') AS status 
            FROM jobs j
            LEFT JOIN projects p ON j.projectId = p.id
            LEFT JOIN clients c ON j.clientId = c.id;
        `);

        res.status(200).json({
            status: "true",
            message: "Jobs fetched successfully",
            jobs: jobs
        });

    } catch (error) {
        console.error("Fetch Invoice Jobs Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



module.exports = { getInvoice };