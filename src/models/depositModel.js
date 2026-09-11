const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const depositsCollection = () => {
    return getDB().collection("deposits");
};


/*
|--------------------------------------------------------------------------
| Create USDT deposit
|--------------------------------------------------------------------------
*/

const createDeposit = async ({
    userId,
    asset = "USDT",
    network,
    amount,
    txHash,
    depositAddress,
    description = null
}) => {

    const now = new Date();

    const deposit = {
        userId: new ObjectId(userId),

        asset,
        network,

        amount,

        txHash,

        depositAddress,

        status: "pending",

        description,

        reviewedBy: null,
        reviewedAt: null,

        rejectionReason: null,

        createdAt: now,
        updatedAt: now
    };

    const result =
        await depositsCollection().insertOne(
            deposit
        );

    return {
        ...deposit,
        _id: result.insertedId
    };
};


/*
|--------------------------------------------------------------------------
| Find deposit by ID
|--------------------------------------------------------------------------
*/

const findDepositById = async (depositId) => {

    return depositsCollection().findOne({
        _id: new ObjectId(depositId)
    });
};


/*
|--------------------------------------------------------------------------
| Find deposit by transaction hash
|--------------------------------------------------------------------------
*/

const findDepositByTxHash = async ({
    txHash,
    network
}) => {

    return depositsCollection().findOne({
        txHash,
        network
    });
};


/*
|--------------------------------------------------------------------------
| Find user's deposits
|--------------------------------------------------------------------------
*/

const findDepositsByUser = async ({
    userId,
    limit = 50
}) => {

    return depositsCollection()
        .find({
            userId: new ObjectId(userId)
        })
        .sort({
            createdAt: -1
        })
        .limit(limit)
        .toArray();
};


/*
|--------------------------------------------------------------------------
| Find pending deposits
|--------------------------------------------------------------------------
*/

const findPendingDeposits = async ({
    limit = 50
} = {}) => {

    return depositsCollection()
        .find({
            status: "pending"
        })
        .sort({
            createdAt: 1
        })
        .limit(limit)
        .toArray();
};


/*
|--------------------------------------------------------------------------
| Approve deposit
|--------------------------------------------------------------------------
*/

const approveDeposit = async ({
    depositId,
    adminId,
    session
}) => {

    return depositsCollection().updateOne(
        {
            _id: new ObjectId(depositId),

            status: "pending"
        },

        {
            $set: {
                status: "approved",

                reviewedBy:
                    new ObjectId(adminId),

                reviewedAt:
                    new Date(),

                updatedAt:
                    new Date()
            }
        },

        {
            session
        }
    );
};


/*
|--------------------------------------------------------------------------
| Reject deposit
|--------------------------------------------------------------------------
*/

const rejectDeposit = async ({
    depositId,
    adminId,
    rejectionReason,
    session
}) => {

    return depositsCollection().updateOne(
        {
            _id: new ObjectId(depositId),

            status: "pending"
        },

        {
            $set: {
                status: "rejected",

                reviewedBy:
                    new ObjectId(adminId),

                reviewedAt:
                    new Date(),

                rejectionReason,

                updatedAt:
                    new Date()
            }
        },

        {
            session
        }
    );
};


module.exports = {
    createDeposit,
    findDepositById,
    findDepositByTxHash,
    findDepositsByUser,
    findPendingDeposits,
    approveDeposit,
    rejectDeposit
};