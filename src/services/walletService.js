const { client } = require("../config/db");

const {
    createWallet,
    findWalletByUserAndAsset,
    findWalletById,
} = require("../models/walletModel");

const {
    createLedgerEntry,
} = require("../models/ledgerModel");

const {
    getDB,
} = require("../config/db");

const {
    toUnits,
    fromUnits,
    addAmounts,
    subtractAmounts,
    compareAmounts,
    isPositiveAmount,
} = require("../utils/money");


const IDEMPOTENCY_COLLECTION = "financialOperations";

const walletsCollection = () => {
    return getDB().collection("wallets");
};

const financialOperationsCollection = () => {
    return getDB().collection(
        IDEMPOTENCY_COLLECTION
    );
};


/*
|--------------------------------------------------------------------------
| Get or create USDT wallet
|--------------------------------------------------------------------------
*/

const getOrCreateUSDTWallet = async (userId) => {
    const existingWallet =
        await findWalletByUserAndAsset({
            userId,
            asset: "USDT",
        });

    if (existingWallet) {
        return existingWallet;
    }

    try {
        return await createWallet({
            userId,
            asset: "USDT",
        });
    } catch (error) {

        // Another request may have created
        // the wallet at the same time.

        if (error.code === 11000) {
            return findWalletByUserAndAsset({
                userId,
                asset: "USDT",
            });
        }

        throw error;
    }
};


/*
|--------------------------------------------------------------------------
| Credit USDT
|--------------------------------------------------------------------------
*/

const creditUSDT = async ({
    userId,
    amount,
    referenceType,
    referenceId,
    description,
    idempotencyKey,
}) => {

    if (!isPositiveAmount(amount)) {
        throw new Error(
            "Amount must be greater than zero"
        );
    }

    if (!idempotencyKey) {
        throw new Error(
            "Idempotency key is required"
        );
    }

    const session = client.startSession();

    try {

        let result;

        await session.withTransaction(
            async () => {

                /*
                |--------------------------------------------------------------------------
                | Check whether this operation was already completed
                |--------------------------------------------------------------------------
                */

                const existingOperation =
                    await financialOperationsCollection()
                        .findOne(
                            {
                                idempotencyKey,
                            },
                            {
                                session,
                            }
                        );

                if (existingOperation) {
                    result =
                        existingOperation.result;

                    return;
                }


                /*
                |--------------------------------------------------------------------------
                | Get or create wallet
                |--------------------------------------------------------------------------
                */

                let wallet =
                    await findWalletByUserAndAsset({
                        userId,
                        asset: "USDT",
                        session,
                    });

                if (!wallet) {
                    try {

                        wallet =
                            await createWallet({
                                userId,
                                asset: "USDT",
                                session,
                            });

                    } catch (error) {

                        if (error.code !== 11000) {
                            throw error;
                        }

                        wallet =
                            await findWalletByUserAndAsset({
                                userId,
                                asset: "USDT",
                                session,
                            });
                    }
                }


                /*
                |--------------------------------------------------------------------------
                | Calculate new balance
                |--------------------------------------------------------------------------
                */

                const balanceBefore =
                    wallet.availableBalance;

                const balanceAfter =
                    addAmounts(
                        balanceBefore,
                        amount
                    );


                /*
                |--------------------------------------------------------------------------
                | Update wallet
                |--------------------------------------------------------------------------
                */

                await walletsCollection().updateOne(
                    {
                        _id: wallet._id,
                    },
                    {
                        $set: {
                            availableBalance:
                                balanceAfter,

                            updatedAt:
                                new Date(),
                        },
                    },
                    {
                        session,
                    }
                );


                /*
                |--------------------------------------------------------------------------
                | Create ledger entry
                |--------------------------------------------------------------------------
                */

                await createLedgerEntry({
                    userId,
                    walletId: wallet._id,
                    asset: "USDT",

                    type: "credit",

                    amount,

                    balanceBefore,

                    balanceAfter,

                    referenceType,
                    referenceId,

                    description,

                    session,
                });


                /*
                |--------------------------------------------------------------------------
                | Store idempotency record
                |--------------------------------------------------------------------------
                */

                result = {
                    walletId:
                        wallet._id.toString(),

                    asset: "USDT",

                    amount,

                    balanceBefore,

                    balanceAfter,
                };

                await financialOperationsCollection()
                    .insertOne(
                        {
                            idempotencyKey,

                            operation: "credit",

                            userId,

                            asset: "USDT",

                            result,

                            createdAt:
                                new Date(),
                        },
                        {
                            session,
                        }
                    );
            }
        );

        return result;

    } finally {
        await session.endSession();
    }
};


/*
|--------------------------------------------------------------------------
| Debit USDT
|--------------------------------------------------------------------------
*/

const debitUSDT = async ({
    userId,
    amount,
    referenceType,
    referenceId,
    description,
    idempotencyKey,
}) => {

    if (!isPositiveAmount(amount)) {
        throw new Error(
            "Amount must be greater than zero"
        );
    }

    if (!idempotencyKey) {
        throw new Error(
            "Idempotency key is required"
        );
    }

    const session = client.startSession();

    try {

        let result;

        await session.withTransaction(
            async () => {

                /*
                |--------------------------------------------------------------------------
                | Idempotency check
                |--------------------------------------------------------------------------
                */

                const existingOperation =
                    await financialOperationsCollection()
                        .findOne(
                            {
                                idempotencyKey,
                            },
                            {
                                session,
                            }
                        );

                if (existingOperation) {
                    result =
                        existingOperation.result;

                    return;
                }


                /*
                |--------------------------------------------------------------------------
                | Find wallet
                |--------------------------------------------------------------------------
                */

                const wallet =
                    await findWalletByUserAndAsset({
                        userId,
                        asset: "USDT",
                        session,
                    });

                if (!wallet) {
                    throw new Error(
                        "USDT wallet not found"
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | Atomic balance deduction
                |--------------------------------------------------------------------------
                */

                const balanceBefore =
                    wallet.availableBalance;

                const balanceBeforeUnits =
                    toUnits(
                        balanceBefore
                    );

                const amountUnits =
                    toUnits(amount);

                if (
                    balanceBeforeUnits <
                    amountUnits
                ) {
                    throw new Error(
                        "Insufficient USDT balance"
                    );
                }

                const balanceAfter =
                    subtractAmounts(
                        balanceBefore,
                        amount
                    );


                /*
                |--------------------------------------------------------------------------
                | IMPORTANT:
                | Only update if the balance is still
                | exactly what we read.
                |--------------------------------------------------------------------------
                */

                const updateResult =
                    await walletsCollection()
                        .updateOne(
                            {
                                _id: wallet._id,

                                availableBalance:
                                    balanceBefore,
                            },
                            {
                                $set: {
                                    availableBalance:
                                        balanceAfter,

                                    updatedAt:
                                        new Date(),
                                },
                            },
                            {
                                session,
                            }
                        );

                if (
                    updateResult.modifiedCount !== 1
                ) {
                    throw new Error(
                        "Wallet balance changed. Please try again."
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | Ledger
                |--------------------------------------------------------------------------
                */

                await createLedgerEntry({
                    userId,
                    walletId: wallet._id,

                    asset: "USDT",

                    type: "debit",

                    amount,

                    balanceBefore,

                    balanceAfter,

                    referenceType,
                    referenceId,

                    description,

                    session,
                });


                /*
                |--------------------------------------------------------------------------
                | Idempotency record
                |--------------------------------------------------------------------------
                */

                result = {
                    walletId:
                        wallet._id.toString(),

                    asset: "USDT",

                    amount,

                    balanceBefore,

                    balanceAfter,
                };

                await financialOperationsCollection()
                    .insertOne(
                        {
                            idempotencyKey,

                            operation: "debit",

                            userId,

                            asset: "USDT",

                            result,

                            createdAt:
                                new Date(),
                        },
                        {
                            session,
                        }
                    );
            }
        );

        return result;

    } finally {
        await session.endSession();
    }
};


/*
|--------------------------------------------------------------------------
| Lock USDT
|--------------------------------------------------------------------------
*/

const lockUSDT = async ({
    userId,
    amount,
    referenceType,
    referenceId,
    description,
    idempotencyKey,
}) => {

    if (!isPositiveAmount(amount)) {
        throw new Error(
            "Amount must be greater than zero"
        );
    }

    if (!idempotencyKey) {
        throw new Error(
            "Idempotency key is required"
        );
    }

    const session = client.startSession();

    try {

        let result;

        await session.withTransaction(
            async () => {

                const existingOperation =
                    await financialOperationsCollection()
                        .findOne(
                            {
                                idempotencyKey,
                            },
                            {
                                session,
                            }
                        );

                if (existingOperation) {
                    result =
                        existingOperation.result;

                    return;
                }

                const wallet =
                    await findWalletByUserAndAsset({
                        userId,
                        asset: "USDT",
                        session,
                    });

                if (!wallet) {
                    throw new Error(
                        "USDT wallet not found"
                    );
                }

                const availableBefore =
                    wallet.availableBalance;

                const lockedBefore =
                    wallet.lockedBalance;

                if (
                    compareAmounts(
                        availableBefore,
                        amount
                    ) < 0
                ) {
                    throw new Error(
                        "Insufficient available USDT balance"
                    );
                }

                const availableAfter =
                    subtractAmounts(
                        availableBefore,
                        amount
                    );

                const lockedAfter =
                    addAmounts(
                        lockedBefore,
                        amount
                    );

                const updateResult =
                    await walletsCollection()
                        .updateOne(
                            {
                                _id: wallet._id,

                                availableBalance:
                                    availableBefore,

                                lockedBalance:
                                    lockedBefore,
                            },
                            {
                                $set: {
                                    availableBalance:
                                        availableAfter,

                                    lockedBalance:
                                        lockedAfter,

                                    updatedAt:
                                        new Date(),
                                },
                            },
                            {
                                session,
                            }
                        );

                if (
                    updateResult.modifiedCount !== 1
                ) {
                    throw new Error(
                        "Wallet balance changed. Please try again."
                    );
                }

                await createLedgerEntry({
                    userId,
                    walletId: wallet._id,

                    asset: "USDT",

                    type: "lock",

                    amount,

                    balanceBefore:
                        availableBefore,

                    balanceAfter:
                        availableAfter,

                    referenceType,
                    referenceId,

                    description:
                        description ||
                        "USDT balance locked",

                    session,
                });

                result = {
                    walletId:
                        wallet._id.toString(),

                    asset: "USDT",

                    amount,

                    availableBalance:
                        availableAfter,

                    lockedBalance:
                        lockedAfter,
                };

                await financialOperationsCollection()
                    .insertOne(
                        {
                            idempotencyKey,

                            operation: "lock",

                            userId,

                            asset: "USDT",

                            result,

                            createdAt:
                                new Date(),
                        },
                        {
                            session,
                        }
                    );
            }
        );

        return result;

    } finally {
        await session.endSession();
    }
};


/*
|--------------------------------------------------------------------------
| Unlock USDT
|--------------------------------------------------------------------------
*/

const unlockUSDT = async ({
    userId,
    amount,
    referenceType,
    referenceId,
    description,
    idempotencyKey,
}) => {

    if (!isPositiveAmount(amount)) {
        throw new Error(
            "Amount must be greater than zero"
        );
    }

    if (!idempotencyKey) {
        throw new Error(
            "Idempotency key is required"
        );
    }

    const session = client.startSession();

    try {

        let result;

        await session.withTransaction(
            async () => {

                const existingOperation =
                    await financialOperationsCollection()
                        .findOne(
                            {
                                idempotencyKey,
                            },
                            {
                                session,
                            }
                        );

                if (existingOperation) {
                    result =
                        existingOperation.result;

                    return;
                }

                const wallet =
                    await findWalletByUserAndAsset({
                        userId,
                        asset: "USDT",
                        session,
                    });

                if (!wallet) {
                    throw new Error(
                        "USDT wallet not found"
                    );
                }

                const availableBefore =
                    wallet.availableBalance;

                const lockedBefore =
                    wallet.lockedBalance;

                if (
                    compareAmounts(
                        lockedBefore,
                        amount
                    ) < 0
                ) {
                    throw new Error(
                        "Insufficient locked USDT balance"
                    );
                }

                const availableAfter =
                    addAmounts(
                        availableBefore,
                        amount
                    );

                const lockedAfter =
                    subtractAmounts(
                        lockedBefore,
                        amount
                    );

                const updateResult =
                    await walletsCollection()
                        .updateOne(
                            {
                                _id: wallet._id,

                                availableBalance:
                                    availableBefore,

                                lockedBalance:
                                    lockedBefore,
                            },
                            {
                                $set: {
                                    availableBalance:
                                        availableAfter,

                                    lockedBalance:
                                        lockedAfter,

                                    updatedAt:
                                        new Date(),
                                },
                            },
                            {
                                session,
                            }
                        );

                if (
                    updateResult.modifiedCount !== 1
                ) {
                    throw new Error(
                        "Wallet balance changed. Please try again."
                    );
                }

                await createLedgerEntry({
                    userId,
                    walletId: wallet._id,

                    asset: "USDT",

                    type: "unlock",

                    amount,

                    balanceBefore:
                        lockedBefore,

                    balanceAfter:
                        lockedAfter,

                    referenceType,
                    referenceId,

                    description:
                        description ||
                        "USDT balance unlocked",

                    session,
                });

                result = {
                    walletId:
                        wallet._id.toString(),

                    asset: "USDT",

                    amount,

                    availableBalance:
                        availableAfter,

                    lockedBalance:
                        lockedAfter,
                };

                await financialOperationsCollection()
                    .insertOne(
                        {
                            idempotencyKey,

                            operation: "unlock",

                            userId,

                            asset: "USDT",

                            result,

                            createdAt:
                                new Date(),
                        },
                        {
                            session,
                        }
                    );
            }
        );

        return result;

    } finally {
        await session.endSession();
    }
};


module.exports = {
    getOrCreateUSDTWallet,
    creditUSDT,
    debitUSDT,
    lockUSDT,
    unlockUSDT,
};