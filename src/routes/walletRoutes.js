const express = require("express");

const {
    getWallet,
    getWalletHistory
} = require("../controllers/walletController");

const {
    requireAuth
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    requireAuth,
    getWallet
);

router.get(
    "/history",
    requireAuth,
    getWalletHistory
);

module.exports = router;