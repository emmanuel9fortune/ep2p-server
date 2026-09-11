const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const paymentsCollection = () => {
    return getDB().collection("payments");
};


/*
|--------------------------------------------------------------------------
| Create payment
|--------------------------------------------------------------------------
*/

const createPayment = async ({
    userId,
    reference,
    provider,
    amount,
    currency = "NGN",
    purpose = "buy_usdt",
    metadata = {}
}) => {

    const now = new Date();

    const payment = {
        userId:
            userId
                ? new ObjectId(userId)
                : null,

        reference,

        provider,

        amount,

        currency,

        purpose,

        status: "pending",

        metadata,

        providerTransactionId: null,

        paidAt: null,

        createdAt: now,

        updatedAt: now
    };

    const result =
        await paymentsCollection().insertOne(
            payment
        );

    return {
        ...payment,
        _id: result.insertedId
    };
};


/*
|--------------------------------------------------------------------------
| Find payment by reference
|--------------------------------------------------------------------------
*/

const findPaymentByReference = async (
    reference
) => {

    return paymentsCollection().findOne({
        reference
    });
};


/*
|--------------------------------------------------------------------------
| Find payment by provider transaction ID
|--------------------------------------------------------------------------
*/

const findPaymentByProviderTransactionId =
    async ({
        provider,
        providerTransactionId
    }) => {

        return paymentsCollection().findOne({
            provider,
            providerTransactionId
        });
    };


/*
|--------------------------------------------------------------------------
| Mark payment successful
|--------------------------------------------------------------------------
*/

const markPaymentSuccessful = async ({
    paymentId,
    providerTransactionId,
    metadata = {},
    session
}) => {

    return paymentsCollection().updateOne(
        {
            _id: new ObjectId(paymentId),

            status: "pending"
        },

        {
            $set: {
                status: "successful",

                providerTransactionId,

                metadata,

                paidAt:
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
| Mark payment failed
|--------------------------------------------------------------------------
*/

const markPaymentFailed = async ({
    paymentId,
    metadata = {},
    session
}) => {

    return paymentsCollection().updateOne(
        {
            _id: new ObjectId(paymentId),

            status: "pending"
        },

        {
            $set: {
                status: "failed",

                metadata,

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
| Find user's payments
|--------------------------------------------------------------------------
*/

const findPaymentsByUser = async ({
    userId,
    limit = 50
}) => {

    return paymentsCollection()
        .find({
            userId:
                new ObjectId(userId)
        })
        .sort({
            createdAt: -1
        })
        .limit(limit)
        .toArray();
};


module.exports = {
    createPayment,
    findPaymentByReference,
    findPaymentByProviderTransactionId,
    markPaymentSuccessful,
    markPaymentFailed,
    findPaymentsByUser
};