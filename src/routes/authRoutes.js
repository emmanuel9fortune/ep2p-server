const express = require("express");

const router = express.Router();

const {
    register
} = require("../controllers/authController");

const {
    registrationLimiter
} = require("../middleware/ratelimiter");

router.post(
    "/register",
    registrationLimiter,
    register
);

module.exports = router;