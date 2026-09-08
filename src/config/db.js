const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

let database;

const connectDB = async () => {
    try {
        await client.connect();

        database = client.db();

        const user = database.collection("users")
        
        await user.createIndex(
            { email: 1 },
            { unique: true }
        );
        
        await user.createIndex(
            { phone: 1 },
            { unique: true }
        );

        console.log("MongoDB connected successfully");

        return database;
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

const getDB = () => {
    if (!database) {
        throw new Error("Database has not been connected");
    }

    return database;
};

module.exports = {
    connectDB,
    getDB
};