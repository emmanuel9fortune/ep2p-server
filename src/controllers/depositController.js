const {
    submitUSDTDeposit
} = require("../services/depositService");

const {
    findDepositsByUser
} = require("../models/depositModel");


/*
|--------------------------------------------------------------------------
| POST /api/deposits/usdt
|--------------------------------------------------------------------------
*/

const submitUSDTDepositController =
    async (req, res) => {

        try {

            const {
                amount,
                network,
                txHash,
                depositAddress,
                description
            } = req.body;


            const deposit =
                await submitUSDTDeposit({
                    userId:
                        req.user._id.toString(),

                    amount,

                    network,

                    txHash,

                    depositAddress,

                    description
                });


            return res.status(201).json({
                success: true,

                message:
                    "USDT deposit submitted for review",

                deposit: {
                    id:
                        deposit._id,

                    asset:
                        deposit.asset,

                    network:
                        deposit.network,

                    amount:
                        deposit.amount,

                    txHash:
                        deposit.txHash,

                    depositAddress:
                        deposit.depositAddress,

                    status:
                        deposit.status,

                    createdAt:
                        deposit.createdAt
                }
            });

        } catch (error) {

            console.error(
                "Submit USDT deposit error:",
                error
            );


            if (
                error.message ===
                "This transaction has already been submitted"
            ) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }


            if (
                error.message ===
                "Unsupported USDT network"
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }


            return res.status(400).json({
                success: false,

                message:
                    error.message ||
                    "Unable to submit deposit"
            });
        }
    };


/*
|--------------------------------------------------------------------------
| GET /api/deposits
|--------------------------------------------------------------------------
*/

const getUserDeposits =
    async (req, res) => {

        try {

            const deposits =
                await findDepositsByUser({
                    userId:
                        req.user._id.toString(),

                    limit: 50
                });


            return res.status(200).json({
                success: true,

                deposits
            });

        } catch (error) {

            console.error(
                "Get user deposits error:",
                error
            );


            return res.status(500).json({
                success: false,

                message:
                    "Unable to retrieve deposits"
            });
        }
    };


module.exports = {
    submitUSDTDepositController,
    getUserDeposits
};