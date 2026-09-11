const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const walletsCollection = () => {
    return getDB().collection("wallets");
};

const createWallet = async ({
    userId,
    asset = "USDT",
    session
}) => {
    const now = new Date();

    const wallet = {
        userId: new ObjectId(userId),
        asset,

        availableBalance: "0",
        lockedBalance: "0",

        createdAt: now,
        updatedAt: now
    };

    const result = await walletsCollection().insertOne(
        wallet,
        { session }
    );

    return {
        ...wallet,
        _id: result.insertedId
    };
};

const findWalletByUserAndAsset = async ({
    userId,
    asset = "USDT",
    session
}) => {
    return walletsCollection().findOne(
        {
            userId: new ObjectId(userId),
            asset
        },
        { session }
    );
};

const findWalletById = async ({
    walletId,
    session
}) => {
    return walletsCollection().findOne(
        {
            _id: new ObjectId(walletId)
        },
        { session }
    );
};

const updateWalletBalances = async ({
    walletId,
    availableBalance,
    lockedBalance,
    session
}) => {
    return walletsCollection().updateOne(
        {
            _id: new ObjectId(walletId)
        },
        {
            $set: {
                availableBalance,
                lockedBalance,
                updatedAt: new Date()
            }
        },
        {
            session
        }
    );
};

module.exports = {
    createWallet,
    findWalletByUserAndAsset,
    findWalletById,
    updateWalletBalances
};