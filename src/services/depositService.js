const {
    createDeposit,
    findDepositByTxHash
} = require("../models/depositModel");


const SUPPORTED_ASSET = "USDT";

const SUPPORTED_NETWORKS = [
    "TRC20"
];


/*
|--------------------------------------------------------------------------
| Submit USDT deposit
|--------------------------------------------------------------------------
*/

const submitUSDTDeposit = async ({
    userId,
    amount,
    network,
    txHash,
    depositAddress,
    description
}) => {

    /*
    |--------------------------------------------------------------------------
    | Basic validation
    |--------------------------------------------------------------------------
    */

    if (!amount) {
        throw new Error(
            "Deposit amount is required"
        );
    }

    if (!network) {
        throw new Error(
            "Network is required"
        );
    }

    if (!txHash) {
        throw new Error(
            "Transaction hash is required"
        );
    }

    if (!depositAddress) {
        throw new Error(
            "Deposit address is required"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Asset
    |--------------------------------------------------------------------------
    */

    const asset = SUPPORTED_ASSET;


    /*
    |--------------------------------------------------------------------------
    | Network
    |--------------------------------------------------------------------------
    */

    const normalizedNetwork =
        network.trim().toUpperCase();

    if (
        !SUPPORTED_NETWORKS.includes(
            normalizedNetwork
        )
    ) {
        throw new Error(
            "Unsupported USDT network"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Normalize transaction hash
    |--------------------------------------------------------------------------
    */

    const normalizedTxHash =
        txHash.trim();


    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate transaction
    |--------------------------------------------------------------------------
    */

    const existingDeposit =
        await findDepositByTxHash({
            txHash: normalizedTxHash,
            network: normalizedNetwork
        });

    if (existingDeposit) {
        throw new Error(
            "This transaction has already been submitted"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Create pending deposit
    |--------------------------------------------------------------------------
    */

    const deposit =
        await createDeposit({
            userId,

            asset,

            network:
                normalizedNetwork,

            amount:

                String(amount).trim(),

            txHash:
                normalizedTxHash,

            depositAddress:
                depositAddress.trim(),

            description:
                description
                    ? description.trim()
                    : null
        });


    return deposit;
};


module.exports = {
    submitUSDTDeposit
};