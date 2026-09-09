const express = require("express");

const router = express.Router();

const {
    register,
    checkEmail,
    checkPhone,
    verifyEmailOTP,
    resendEmailOTP,
    login
} = require("../controllers/authController");

const {
    registrationLimiter,
    authLimiter
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

router.post(
    "/verify-email-otp",
    registrationLimiter,
    verifyEmailOTP
);

router.post(
    "/resend-email-otp",
    registrationLimiter,
    resendEmailOTP
);

router.post(
    "/login",
    authLimiter,
    login
);

module.exports = router;