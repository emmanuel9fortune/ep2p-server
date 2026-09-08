const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const {
    globalLimiter
} = require("./middleware/ratelimiter");

const authRoutes = require("./routes/authRoutes");

const app = express();


// -----------------------------
// Middleware
// -----------------------------

app.use(cors());

app.use(bodyParser.json());

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(globalLimiter);


// -----------------------------
// Routes
// -----------------------------

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Crypto platform API is running"
    });
});

app.use("/api/auth", authRoutes);


// -----------------------------
// Export
// -----------------------------

module.exports = app;