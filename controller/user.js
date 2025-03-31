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


//Register User
const signUp = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        console.log(req.body, "-------------");

        // Validate role (only 1, 2, 3, 4 allowed)
        const validRoles = [1, 2, 3, 4];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ status: "false", message: 'Invalid role. Allowed values: 1 (Admin), 2 (Production), 3 (Employee), 4 (Client)', data: [] });
        }

        // Check if user already exists (by email)
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ status: "false", message: 'User already exists with this email', data: [] });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database (No confirmPassword)
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
            [name, email, hashedPassword, role]
        );

        // Fetch the complete user data (excluding password)
        const [newUser] = await db.query('SELECT id, name, email, password, role FROM users WHERE id = ?', [result.insertId]);

        // Generate JWT Token
        const token = jwt.sign({ id: newUser[0].id, role: newUser[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send response with full user data
        res.status(201).json({
            status: "true",
            message: 'User registered successfully',
            data: { ...newUser[0], token }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



const editProfile = async (req, res) => {
    try {
        const id = req.query.id; 
        console.log("Received User ID:", id);

        const { firstName, lastName, phone, email, password, address, country, state, city, postal } = req.body;


        // Check if user exists
        const [existingUser] = await db.query('SELECT * FROM user WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({ status: "false", message: 'User not found', data: [] });
        }

        // Handle Image Upload
        let image = existingUser[0].image; // Keep existing image if no new image is uploaded
        if (req.file) {
            image = `http://127.0.0.1:5002/upload/${req.file.filename}`;
        }

        // Hash password only if it's provided
        let hashedPassword = existingUser[0].password; // Keep existing password if no new one is provided
        if (password) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }

        // Update user details in the database
        await db.query(
            'UPDATE user SET firstName = ?, lastName = ?, phone = ?, email = ?, password = ?, address = ?, country = ?, state = ?, city = ?, postal = ?, image = ? WHERE id = ?',
            [firstName, lastName, phone, email, hashedPassword, address, country, state, city, postal, image, id]
        );

        // Fetch updated user data
        const [updatedUser] = await db.query('SELECT * FROM user WHERE id = ?', [id]);

        res.status(200).json({
            status: "true",
            message: 'User updated successfully',
            data: updatedUser[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users');

        if (users.length === 0) {
            return res.status(404).json({ status: "false", message: "No users found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Users retrieved successfully", data: users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// Get User by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found", data: [] });
        }

        res.status(200).json({ status: "true", message: "User retrieved successfully", data: user[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const checkGoogleDetails = async (req, res) => {
    try {
        const { email, googleSignIn } = req.body;

        // Step 1: Validate Email
        if (!email) {
            return res.status(400).json({ status: "false", message: "Email is required", data: [] });
        }

        // Step 2: Fetch User
        const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUser.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found with this email.", data: [] });
        }

        // Step 3: Prepare update fields dynamically
        const updateFields = [];
        const values = [];

        if (googleSignIn) {
            updateFields.push("googleSignIn = ?");
            values.push(googleSignIn);
        }

        // if (image) {
        //     updateFields.push("image = ?");
        //     values.push(image);
        // }

        // Step 4: Update the user if needed
        if (updateFields.length > 0) {
            values.push(email);
            const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE email = ?`;
            await db.execute(updateQuery, values);
        }

        // Step 5: Fetch Updated User Data (Ensuring Correct Column Name)
        const [updatedUser] = await db.execute('SELECT id, name, email, password, googleSignIn FROM users WHERE email = ?', [email]);

        return res.status(200).json({
            status: "true",
            message: "Google details updated successfully",
            data: updatedUser[0]  // Only valid `googleSignIn` field will be returned
        });

    } catch (error) {
        console.error("Google Sign-In Error:", error);
        res.status(500).json({ status: "false", message: "Server error", error: error.message });
    }
};


//delete user
const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params; 

        const [existingUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

        if (existingUser.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found", data: [] });
        }
                
        await db.query('DELETE FROM user WHERE id = ?', [id]);

        res.status(200).json({
            status: "true",
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};



// const forgotPassword = async (req, res) => {
//     try {
//         const { email, newPassword } = req.body;

//         // Check if user exists
//         const [user] = await db.query("SELECT * FROM user WHERE email = ?", [email]);
//         if (user.length === 0) {
//             return res.status(404).json({ status: "false", message: "User not found with this email." });
//         }

//         // Hash new password
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         // Update password and confirmPassword
//         await db.query("UPDATE user SET password = ?, confirmPassword = ? WHERE email = ?", 
//             [hashedPassword, hashedPassword, email]);

//         res.status(200).json({ status: "true", message: "Password updated successfully." });

//     } catch (error) {
//         console.error("Forgot Password Error:", error);
//         res.status(500).json({ status: "false", message: "Server error" });
//     }
// };



const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1️⃣ Check karo ki user exist karta hai ya nahi
        const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User nahi mila." });
        }

        // 2️⃣ Google Sign-In users ka password reset allow nahi hoga
        if (user[0].googleSignIn === "true") {
            return res.status(400).json({
                status: "false",
                message: "Password reset is not allowed for Google Sign-In users. Please log in using Google."

            });
        }

        // 3️⃣ Ek Unique Reset Token Generate karo
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min valid rahega

        // 4️⃣ Database me Token Save karo
        await db.query("UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?", 
                       [resetToken, resetTokenExpiry, email]);

        // 5️⃣ Email bhejne ke liye Nodemailer ka use karo
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: 'packageitappofficially@gmail.com',
                pass: 'epvuqqesdioohjvi',
            },
        });

        await transporter.sendMail({
            from: 'sagar.kiaan12@gmail.com',
            to: email,
            subject: "Your Password Reset Token",
            html: `<p>Your password reset token: <strong>${resetToken}</strong></p>
                    <p>This token is valid for <strong>15 minutes</strong>.</p>
                    <p>If you did not request this, please ignore this email.</p>`,

        });

        res.status(200).json({ status: "true", message: "Password reset send email successfully." });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1️⃣ Check karo ki user exist karta hai ya nahi
        const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found with this email." });
        }

        // 2️⃣ Google Sign-In users ka password reset allow nahi hoga
        if (user[0].googleSignIn === "true") {
            return res.status(400).json({
                status: "false",
                message: "Password reset is not allowed for Google sign-in users. Please use Google to log in."
            });
        }

        // 3️⃣ Naya password hash karo
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4️⃣ Password update karo
        await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

        res.status(200).json({ status: "true", message: "Password reset successfully." });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const [user] = await db.query('SELECT id, email, password, role FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(400).json({ status: "false", message: 'Invalid email or password', data: [] });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(400).json({ status: "false", message: 'Invalid email or password', data: [] });
        }

        // Generate JWT Token (Include Role)
        const token = jwt.sign(
            { id: user[0].id, email: user[0].email, role: user[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Prepare response data (remove password)
        const userData = {
            id: user[0].id.toString(),
            email: user[0].email,
            role: user[0].role,  // Role included in response
            token: token
        };

        res.json({ status: "true", message: 'Login successful', data: userData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};




// Protected Route
const protectedRoute = (req, res) => {
    res.json({ message: 'You have accessed a protected route!', user: req.user });
};



// Export the functions
module.exports = { login, signUp, editProfile, getAllUsers, getUserById, checkGoogleDetails, deleteUserById, forgotPassword, resetPassword, protectedRoute };
