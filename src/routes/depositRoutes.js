const express = require("express");

const {
    submitUSDTDepositController,
    getUserDeposits
} = require("../controllers/depositController");

const {
    requireAuth
} = require("../middleware/authMiddleware");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| User deposit routes
|--------------------------------------------------------------------------
*/

router.post(
    "/usdt",
    requireAuth,
    submitUSDTDepositController
);


router.get(
    "/",
    requireAuth,
    getUserDeposits
);


module.exports = router;