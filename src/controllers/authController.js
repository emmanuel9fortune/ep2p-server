const argon2 = require("argon2");

const {
    createUser,
    findUserByEmail,
    findUserByPhone,
    verifyUserEmail
} = require("../models/userModel");

const {
    validateRegistration
} = require("../utils/validation");

const { ObjectId } = require("mongodb");
const { 
    createOTP,
    findLatestOTP,
    incrementAttempts,
    markOTPVerified,
    invalidatePreviousOTPs
} = require("../models/otpModel");
const { generateOTP, hashOTP } = require("../utils/otp");
const { generateAccessToken } = require("../services/authServices");

const register = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            password
        } = req.body;

        // Validate input
        const validation = validateRegistration({
            firstName,
            lastName,
            email,
            phone,
            password
        });

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validation.errors
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await findUserByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const normalizedPhone = phone.trim();
        
        const existingPhone = await findUserByPhone(
            normalizedPhone
        );

        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: "An account with this phone number already exists"
            });
        }

        // Hash password
        const passwordHash = await argon2.hash(password);

        // Create user
        const user = await createUser({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            passwordHash
        });

        const otp = generateOTP();
        // console.log(otp);

        const otpHash = hashOTP(otp);

        await createOTP({
            userId: user._id,
            email: user.email,
            otpHash,
            purpose: "account_verification"
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully"
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const existingUser = await findUserByEmail(
            normalizedEmail
        );

        if (existingUser) {
            return res.status(200).json({
                success: true,
                available: false,
                message: "Email is already registered"
            });
        }

        return res.status(200).json({
            success: true,
            available: true,
            message: "Email is available"
        });

    } catch (error) {
        console.error("Check email error:", error);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};


const checkPhone = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        const normalizedPhone = phone.trim();

        const existingUser = await findUserByPhone(
            normalizedPhone
        );

        if (existingUser) {
            return res.status(200).json({
                success: true,
                available: false,
                message: "Phone number is already registered"
            });
        }

        return res.status(200).json({
            success: true,
            available: true,
            message: "Phone number is available"
        });

    } catch (error) {
        console.error("Check phone error:", error);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const normalizedOTP = otp.trim();

        // OTP must be exactly 6 digits
        if (!/^\d{6}$/.test(normalizedOTP)) {
            return res.status(400).json({
                success: false,
                message: "OTP must be a 6-digit code"
            });
        }

        // Find the user
        const user = await findUserByEmail(
            normalizedEmail
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        // Already verified
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        // Find latest unused OTP
        const otpRecord = await findLatestOTP({
            userId: user._id,
            purpose: "email_verification"
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Verification code is invalid or has expired"
            });
        }

        // Check expiration
        if (
            new Date() >
            new Date(otpRecord.expiresAt)
        ) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired"
            });
        }

        // Check maximum attempts
        if (
            otpRecord.attempts >=
            otpRecord.maxAttempts
        ) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please request a new code."
            });
        }

        // Hash the submitted OTP
        const submittedOTPHash = hashOTP(
            normalizedOTP
        );

        // Count this attempt
        await incrementAttempts(
            otpRecord._id
        );

        // Compare hashes
        if (
            submittedOTPHash !==
            otpRecord.otpHash
        ) {
            return res.status(400).json({
                success: false,
                message: "Incorrect verification code"
            });
        }

        // Mark OTP as used
        await markOTPVerified(
            otpRecord._id
        );

        // Verify user's email
        await verifyUserEmail(
            user._id
        );

        // Generate access token
        const token =
            generateAccessToken(user);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                status: "active",
                emailVerified: true,
                phoneVerified: user.phoneVerified
            }
        });

    } catch (error) {
        console.error(
            "Email OTP verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

const resendEmailOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        // Find the user
        const user = await findUserByEmail(
            normalizedEmail
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        // Don't resend if already verified
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        // Invalidate previous OTPs
        await invalidatePreviousOTPs({
            userId: user._id,
            purpose: "email_verification"
        });

        // Generate new OTP
        const otp = generateOTP();
        // console.log(otp);
        

        // Hash OTP before storing
        const otpHash = hashOTP(otp);

        // Store new OTP
        await createOTP({
            userId: user._id,
            email: user.email,
            otpHash,
            purpose: "email_verification"
        });

        // DEVELOPMENT ONLY
        console.log(
            `New email verification OTP for ${user.email}: ${otp}`
        );

        return res.status(200).json({
            success: true,
            message: "A new verification code has been sent to your email"
        });

    } catch (error) {
        console.error(
            "Resend email OTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to resend verification code"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // -----------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        // -----------------------------------------
        // FIND USER
        // -----------------------------------------

        const user = await findUserByEmail(
            normalizedEmail
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // -----------------------------------------
        // CHECK ACCOUNT STATUS
        // -----------------------------------------

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in"
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is not currently active"
            });
        }

        // -----------------------------------------
        // VERIFY PASSWORD
        // -----------------------------------------

        const passwordIsValid = await argon2.verify(
            user.passwordHash,
            password
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // -----------------------------------------
        // GENERATE ACCESS TOKEN
        // -----------------------------------------

        const token = generateAccessToken(user);

        // -----------------------------------------
        // RETURN SAFE USER DATA
        // -----------------------------------------

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                status: user.status,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified
            }
        });

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to login at this time"
        });
    }
};

module.exports = {
    register,
    checkEmail,
    checkPhone,
    login,
    verifyEmailOTP,
    resendEmailOTP
};