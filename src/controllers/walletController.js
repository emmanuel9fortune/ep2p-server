const {
    getOrCreateUSDTWallet
} = require("../services/walletService");

const {
    findLedgerEntriesByUser
} = require("../models/ledgerModel");

const getWallet = async (req, res) => {
    try {
        const wallet =
            await getOrCreateUSDTWallet(
                req.user._id
            );

        return res.status(200).json({
            success: true,

            wallet: {
                id: wallet._id,
                asset: wallet.asset,

                availableBalance:
                    wallet.availableBalance,

                lockedBalance:
                    wallet.lockedBalance,

                totalBalance:
                    wallet.availableBalance
            }
        });

    } catch (error) {
        console.error(
            "Get wallet error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve wallet"
        });
    }
};

const getWalletHistory = async (req, res) => {
    try {
        const entries =
            await findLedgerEntriesByUser({
                userId: req.user._id,
                asset: "USDT"
            });

        return res.status(200).json({
            success: true,
            entries
        });

    } catch (error) {
        console.error(
            "Get wallet history error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve wallet history"
        });
    }
};

module.exports = {
    getWallet,
    getWalletHistory
};