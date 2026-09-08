const argon2 = require("argon2");

const {
    createUser,
    findUserByEmail
} = require("../models/userModel");

const {
    validateRegistration
} = require("../utils/validation");
const { createOTP } = require("../models/otpModel");

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

module.exports = {
    register,
    checkEmail,
    checkPhone
};