const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const {
    globalLimiter
} = require("./middleware/ratelimiter");

const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const depositRoutes = require("./routes/depositRoutes");

const app = express();


// -----------------------------
// Middleware
// -----------------------------

const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests without an Origin header
        // such as some server-to-server requests.
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(
            new Error("Not allowed by CORS")
        );
    },

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],

    credentials: true,

    maxAge: 86400
};

app.use(cors(corsOptions));

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
app.use("/api/wallet", walletRoutes);
app.use("/api/deposits", depositRoutes);


// -----------------------------
// Export
// -----------------------------

module.exports = app;