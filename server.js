import express from "express";
import mongoose from "mongoose";

var app = express();

app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/ROZEVA")
    .then(function () {
        console.log("MongoDB Connected Successfully!");
    })
    .catch(function (error) {
        console.log("MongoDB Connection Error:", error);
    });

app.get("/api/test", function (req, res) {
    res.json({
        message: "ROZEVA backend is working!"
    });
});

app.listen(3000, function () {
    console.log("Server running at http://localhost:3000");
});