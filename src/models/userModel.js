const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const usersCollection = () => {
    return getDB().collection("users");
};

const createUser = async ({
    firstName,
    lastName,
    dob,
    email,
    phone,
    passwordHash
}) => {
    const now = new Date();

    const user = {
        firstName,
        lastName,
        dob,

        email,
        phone,
        passwordHash,

        status: "pending_verification",

        emailVerified: false,
        phoneVerified: false,

        createdAt: now,
        updatedAt: now
    };

    const result = await usersCollection().insertOne(user);

    return {
        ...user,
        _id: result.insertedId
    };
};

const findUserByEmail = async (email) => {
    return usersCollection().findOne({
        email: email.toLowerCase()
    });
};

const findUserByPhone = async (phone) => {
    return usersCollection().findOne({
        phone
    });
};

const findUserById = async (userId) => {
    return usersCollection().findOne({
        _id: new ObjectId(userId)
    });
};

const verifyUserEmail = async (userId) => {
    return usersCollection().updateOne(
        {
            _id: userId
        },
        {
            $set: {
                emailVerified: true,
                status: "active",
                updatedAt: new Date()
            }
        }
    );
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserByPhone,
    findUserById,
    verifyUserEmail
};