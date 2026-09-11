const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const { findUserById } = require("../models/userModel");

const requireAuth = async (req, res, next) => {
    try {
        const authorization =
            req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const parts = authorization.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication format"
            });
        }

        const token = parts[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.type !== "access") {
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
        }

        if (!decoded.sub || !ObjectId.isValid(decoded.sub)) {
            return res.status(401).json({
                success: false,
                message: "Invalid user identity"
            });
        }

        const user = await findUserById(
            decoded.sub
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found"
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "User account is not active"
            });
        }

        req.user = user;

        next();

    } catch (error) {
        // console.error(
        //     "Authentication middleware error:",
        //     error
        // );

        if (
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Access token has expired"
            });
        }

        if (
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Authentication error"
        });
    }
};

module.exports = {
    requireAuth
};