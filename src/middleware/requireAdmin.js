
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const {
    findUserById,
} = require("../models/userModel");

const requireAuth = async (
    req,
    res,
    next
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const token =
            authHeader.split(" ")[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        if (decoded.type !== "access") {
            return res.status(401).json({
                success: false,
                message: "Invalid access token.",
            });
        }

        if (
            !ObjectId.isValid(decoded.sub)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid user.",
            });
        }

        const user =
            await findUserById(decoded.sub);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found.",
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Account is not active.",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error(
            "Authentication error:",
            error
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

module.exports = {
    requireAuth,
};

