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


const getDashboardMetrics = async (req, res) => {
    try {
        const [[activeProjects]] = await db.query("SELECT COUNT(*) AS activeProjects FROM projects WHERE status = 'Active'");
        const [[totalJobs]] = await db.query("SELECT COUNT(*) AS totalJobs FROM jobs");
        const [[totalManagers]] = await db.query("SELECT COUNT(*) AS totalManagers FROM productionmanager");
        const [[totalClients]] = await db.query("SELECT COUNT(*) AS totalClients FROM clients");

        res.status(200).json({
            status: "true",
            message: "Reterived Data Successfully",
            data: {
                activeProjects: activeProjects.activeProjects.toString(),
                totalJobs: totalJobs.totalJobs.toString(),
                totalManagers: totalManagers.totalManagers.toString(),
                totalClients: totalClients.totalClients.toString()
            }
        });
    } catch (error) {
        console.error("Dashboard Metrics Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

const getTaskSummary = async (req, res) => {
    try {
        const [[lateTasks]] = await db.query(
            "SELECT COUNT(*) AS lateTasks FROM jobs WHERE targetDate < CURDATE()"
        );
        const [[upcomingTasks]] = await db.query(
            "SELECT COUNT(*) AS upcomingTasks FROM jobs WHERE targetDate >= CURDATE()"
        );

        res.status(200).json({
            status: "true",
            message: "Reterive data successfully",
            data: {
                lateTasks: lateTasks.lateTasks.toString(),
                upcomingTasks: upcomingTasks.upcomingTasks.toString()
            }
        });
    } catch (error) {
        console.error("Task Summary Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const getRecentActivities = async (req, res) => {
    try {
        const [activities] = await db.query(
            "SELECT name AS user_name, role AS action, created_at AS timestamp FROM users ORDER BY created_at ASC"
        );

        res.status(200).json({ status: "true", data: activities });
    } catch (error) {
        console.error("Recent Activities Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }  
};




module.exports = { getDashboardMetrics, getTaskSummary, getRecentActivities };




