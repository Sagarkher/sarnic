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


const assignTask = async (req, res) => {
    try {
        const { projectId, taskName, assignTo, deadline, priority, description } = req.body;

        if (!projectId || !taskName || !assignTo || !deadline || !priority) {
            return res.status(400).json({ status: "false", message: "All fields are required" });
        }

        const [result] = await db.query(
            `INSERT INTO tasks (projectId, taskName, assignTo, deadline, priority, description) VALUES (?, ?, ?, ?, ?, ?)`,
            [projectId, taskName, assignTo, deadline, priority, description]
        );

        const [newTask] = await db.query(`SELECT * FROM tasks WHERE id = ?`, [result.insertId]);

        res.status(201).json({ 
            status: "true", 
            message: "Task assigned successfully", 
            data: newTask[0] 
        });

    } catch (error) {
        console.error("Assign Task Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const getPendingReviewSubmissions = async (req, res) => {
    try {
        const [submissions] = await db.query(`
            SELECT 
                t.id AS taskId,
                t.taskName,
                u.name AS submittedBy,
                t.deadline AS deadline,
                t.status,
                t.description
            FROM tasks t
            LEFT JOIN users u ON t.assignTo = u.id
            WHERE t.status = 'Pending'
            ORDER BY t.deadline ASC
        `);

        res.status(200).json({ status: "true", data: submissions });
    } catch (error) {
        console.error("Error fetching review submissions:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const approveReviewSubmission = async (req, res) => {
    try {
        const { taskId } = req.params;

        const [result] = await db.query(`
            UPDATE tasks 
            SET status = 'Approved' 
            WHERE id = ?`, 
            [taskId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "false", message: "Task not found" });
        }

        const [updatedTask] = await db.query(`
            SELECT id AS taskId, taskName, status FROM tasks WHERE id = ?`, 
            [taskId]
        );

        res.status(200).json({ status: "true", message: "Task approved successfully", data: updatedTask[0] });
    } catch (error) {
        console.error("Error approving task:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const rejectReviewSubmission = async (req, res) => {
    try {
        const { taskId } = req.params;

        const [result] = await db.query(`
            UPDATE tasks 
            SET status = 'Rejected' 
            WHERE id = ?`, 
            [taskId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "false", message: "Task not found" });
        }

        const [updatedTask] = await db.query(`
            SELECT id AS taskId, taskName, status FROM tasks WHERE id = ?`, 
            [taskId]
        );

        res.status(200).json({ status: "true", message: "Task approved successfully", data: updatedTask[0] });
    } catch (error) {
        console.error("Error approving task:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const getApprovedData = async (req, res) => {
    try {
        const [jobs] = await db.query("SELECT * FROM tasks WHERE status = 'Approved'");

        if (jobs.length === 0) {
            return res.status(404).json({ status: "false", message: "No jobs found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Projects retrieved successfully", data: jobs });
    } catch (error) {
        console.error("Error fetching rejected tasks:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const getRejetedData = async (req, res) => {
    try {
        const [jobs] = await db.query("SELECT * FROM tasks WHERE status = 'Rejected'");

        if (jobs.length === 0) {
            return res.status(404).json({ status: "false", message: "No jobs found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Projects retrieved successfully", data: jobs });
    } catch (error) {
        console.error("Error fetching rejected tasks:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};



const getProductionDashboard = async (req, res) => {
    try {
        // Get total task count
        const [[{ totalTasks }]] = await db.query("SELECT COUNT(*) AS totalTasks FROM tasks");

        // Get task status breakdown
        const [[{ inProgress }]] = await db.query("SELECT COUNT(*) AS inProgress FROM tasks WHERE status = 'In Progress'");
        const [[{ completed }]] = await db.query("SELECT COUNT(*) AS completed FROM tasks WHERE status = 'Completed'");
        const [[{ approved }]] = await db.query("SELECT COUNT(*) AS approved FROM tasks WHERE status = 'Approved'");
        const [[{ rejected }]] = await db.query("SELECT COUNT(*) AS rejected FROM tasks WHERE status = 'Rejected'");
        const [[{ pending }]] = await db.query("SELECT COUNT(*) AS pending FROM tasks WHERE status = 'Pending'");
        const [[{ overdue }]] = await db.query("SELECT COUNT(*) AS overdue FROM tasks WHERE endDate < CURDATE() AND status != 'Completed'");

        // Get team workload
        const [teamWorkload] = await db.query(`
            SELECT u.name AS assignedTo, COUNT(t.id) AS taskCount 
            FROM tasks t 
            LEFT JOIN users u ON t.assignTo = u.id 
            GROUP BY t.assignTo
        `);

        // Get recent tasks
        const [recentTasks] = await db.query(`
            SELECT t.id, t.taskName, u.name AS assignedTo, t.endDate, t.status, t.priority 
            FROM tasks t 
            LEFT JOIN users u ON t.assignTo = u.id 
            ORDER BY t.timestamp DESC 
            LIMIT 5
        `);

        // Send response
        res.status(200).json({
            status: "true",
            data: {
                totalTasks,
                taskBreakdown: { pending, inProgress, completed, approved, rejected, overdue },
                teamWorkload,
                recentTasks
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};




module.exports = { assignTask, getPendingReviewSubmissions, approveReviewSubmission, rejectReviewSubmission, getApprovedData, getRejetedData, getProductionDashboard };
