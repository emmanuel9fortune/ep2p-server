const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const ledgerCollection = () => {
    return getDB().collection("ledgerEntries");
};

const createLedgerEntry = async ({
    userId,
    walletId,
    asset,
    type,
    amount,
    balanceBefore,
    balanceAfter,
    referenceType,
    referenceId,
    description,
    session
}) => {
    const now = new Date();

    const entry = {
        userId: new ObjectId(userId),
        walletId: new ObjectId(walletId),

        asset,
        type,

        amount,
        balanceBefore,
        balanceAfter,

        referenceType,
        referenceId: referenceId || null,

        description: description || null,

        createdAt: now
    };

    const result = await ledgerCollection().insertOne(
        entry,
        { session }
    );

    return {
        ...entry,
        _id: result.insertedId
    };
};

const findLedgerEntriesByUser = async ({
    userId,
    asset = "USDT",
    limit = 50
}) => {
    return ledgerCollection()
        .find({
            userId: new ObjectId(userId),
            asset
        })
        .sort({
            createdAt: -1
        })
        .limit(limit)
        .toArray();
};

module.exports = {
    createLedgerEntry,
    findLedgerEntriesByUser
};