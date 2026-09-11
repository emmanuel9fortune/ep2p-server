const { MongoClient } = require("mongodb");

if (!process.env.MONGODB_URI) {
    throw new Error(
        "MONGODB_URI is not configured"
    );
}

const client = new MongoClient(
    process.env.MONGODB_URI,
    {
        maxPoolSize: 20,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 15000,
        retryWrites: true,
    }
);


let database;

const connectDB = async () => {
    try {
        await client.connect();

        database = client.db();

        const users = database.collection("users");
        const wallets = database.collection("wallets");
        const ledgerEntries = database.collection("ledgerEntries");
        const financialOperations = database.collection("financialOperations");
        const deposits = database.collection("deposits");
        const payments = database.collection("payments");

        // Users
        await users.createIndex(
            { email: 1 },
            { unique: true }
        );

        await users.createIndex(
            { phone: 1 },
            { unique: true }
        );

        // Wallets
        await wallets.createIndex(
            { userId: 1, asset: 1 },
            { unique: true }
        );

        // Ledger
        await ledgerEntries.createIndex({
            userId: 1,
            createdAt: -1
        });

        await ledgerEntries.createIndex({
            walletId: 1,
            createdAt: -1
        });

        await ledgerEntries.createIndex({
            referenceType: 1,
            referenceId: 1
        });


        await financialOperations.createIndex(
            { idempotencyKey: 1 },
            { unique: true }
        );

        await deposits.createIndex({
            userId: 1,
            createdAt: -1
        });

        await deposits.createIndex({
            status: 1,
            createdAt: 1
        });

        await deposits.createIndex(
            {
                txHash: 1,
                network: 1
            },
            {
                unique: true,
                sparse: true
            }
        );

        await payments.createIndex(
            {
                reference: 1
            },
            {
                unique: true
            }
        );

        await payments.createIndex({
            userId: 1,
            createdAt: -1
        });

        await payments.createIndex({
            provider: 1,
            providerTransactionId: 1
        });


        console.log("MongoDB connected successfully");

        return database;

    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error
        );

        process.exit(1);
    }
};

const getDB = () => {
    if (!database) {
        throw new Error(
            "Database has not been connected"
        );
    }

    return database;
};

module.exports = {
    connectDB,
    getDB,
    client
};