import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

var router = express.Router();

function createToken(user) {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
}

function cookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    };
}

// SIGN UP
router.post("/signup", async function (req, res) {
    try {
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        email = email.trim().toLowerCase();

        var existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        var hashedPassword = await bcrypt.hash(password, 12);

        var newUser = new User({
            name: name.trim(),
            email: email,
            password: hashedPassword
        });

        await newUser.save();

        var token = createToken(newUser);

        res.cookie("rozevaToken", token, cookieOptions());

        res.status(201).json({
            success: true,
            message: "Account created successfully!",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        console.log("Signup Error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
});


// SIGN IN
router.post("/signin", async function (req, res) {
    try {
        var email = req.body.email;
        var password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password."
            });
        }

        email = email.trim().toLowerCase();

        var user = await User.findOne({ email: email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        var passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        var token = createToken(user);

        res.cookie("rozevaToken", token, cookieOptions());

        res.json({
            success: true,
            message: "Login successful!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.log("Signin Error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
});


// CHECK LOGIN
router.get("/me", async function (req, res) {
    try {
        var token = req.cookies.rozevaToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please sign in first."
            });
        }

        var decoded = jwt.verify(token, process.env.JWT_SECRET);

        var user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            user: user
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Session expired. Please sign in again."
        });
    }
});


// LOGOUT
router.post("/logout", function (req, res) {
    res.clearCookie("rozevaToken", cookieOptions());

    res.json({
        success: true,
        message: "Logged out successfully!"
    });
});

export default router;