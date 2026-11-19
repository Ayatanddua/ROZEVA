require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Yahan signupSchema aur app.post("/api/signup", ...) paste karein
const signupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    consent: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

const Signup = mongoose.model("Signup", signupSchema);

app.post("/api/signup", async (req, res) => {
  try {
    const { name = "", email, consent } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      consent !== true
    ) {
      return res.status(400).json({
        error: "Valid email dein aur email updates ke liye consent karein.",
      });
    }

    await Signup.create({
      name: typeof name === "string" ? name.trim() : "",
      email: email.trim().toLowerCase(),
      consent: true,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Yeh email pehle se signup hai.",
      });
    }

    console.error("Signup error:", error);
    res.status(500).json({ error: "Server par masla hua." });
  }
});

// MongoDB connect hone ke baad website server start hoga
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(process.env.PORT || 3000, () => {
      console.log("Website http://localhost:3000 par chal rahi hai");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });