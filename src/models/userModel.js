const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const usersCollection = () => {
    return getDB().collection("users");
};

const createUser = async ({
    firstName,
    lastName,
    email,
    phone,
    passwordHash
}) => {
    const now = new Date();

    const user = {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,

        status: "active",

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

const findUserById = async (userId) => {
    return usersCollection().findOne({
        _id: new ObjectId(userId)
    });
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById
};