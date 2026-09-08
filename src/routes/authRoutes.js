const express = require("express");

const router = express.Router();

const {
    register,
    checkEmail,
    checkPhone
} = require("../controllers/authController");

const {
    registrationLimiter
} = require("../middleware/ratelimiter");

router.post(
    "/register",
    registrationLimiter,
    register
);

router.post(
    "/check-email",
    registrationLimiter,
    checkEmail
);

router.post(
    "/check-phone",
    registrationLimiter,
    checkPhone
);

module.exports = router;