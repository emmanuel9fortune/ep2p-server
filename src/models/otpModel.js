const { getDB } = require("../config/db");

const otpCollection = () => {
    return getDB().collection("otpVerifications");
};

const createOTP = async ({
    userId,
    email,
    otpHash,
    purpose
}) => {
    const now = new Date();

    const otp = {
        userId,
        email,
        otpHash,
        purpose,

        attempts: 0,
        maxAttempts: 5,

        expiresAt: new Date(
            now.getTime() + 10 * 60 * 1000
        ),

        verified: false,

        createdAt: now
    };

    const result = await otpCollection().insertOne(otp);

    return {
        ...otp,
        _id: result.insertedId
    };
};

const findLatestOTP = async ({
    userId,
    purpose
}) => {
    return otpCollection()
        .find({
            userId,
            purpose,
            verified: false
        })
        .sort({
            createdAt: -1
        })
        .limit(1)
        .next();
};

const incrementAttempts = async (otpId) => {
    return otpCollection().updateOne(
        {
            _id: otpId
        },
        {
            $inc: {
                attempts: 1
            }
        }
    );
};

const markOTPVerified = async (otpId) => {
    return otpCollection().updateOne(
        {
            _id: otpId
        },
        {
            $set: {
                verified: true,
                verifiedAt: new Date()
            }
        }
    );
};

module.exports = {
    createOTP,
    findLatestOTP,
    incrementAttempts,
    markOTPVerified
};