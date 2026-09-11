const DECIMAL_PLACES = 6;
const SCALE = 10n ** BigInt(DECIMAL_PLACES);

/**
 * Convert a decimal amount to integer base units.
 *
 * Example:
 * "10.500000" -> 10500000
 */
const toUnits = (amount) => {
    const value = String(amount).trim();

    if (!/^\d+(\.\d+)?$/.test(value)) {
        throw new Error("Invalid monetary amount");
    }

    const [whole, decimal = ""] = value.split(".");

    if (decimal.length > DECIMAL_PLACES) {
        throw new Error(
            `Amount cannot have more than ${DECIMAL_PLACES} decimal places`
        );
    }

    const paddedDecimal = decimal.padEnd(
        DECIMAL_PLACES,
        "0"
    );

    return (
        BigInt(whole) * SCALE +
        BigInt(paddedDecimal)
    );
};


/**
 * Convert integer base units back to decimal string.
 *
 * Example:
 * 10500000 -> "10.5"
 */
const fromUnits = (units) => {
    const value = BigInt(units);

    if (value < 0n) {
        throw new Error(
            "Amount cannot be negative"
        );
    }

    const whole = value / SCALE;

    const decimal = (
        value % SCALE
    )
        .toString()
        .padStart(
            DECIMAL_PLACES,
            "0"
        )
        .replace(/0+$/, "");

    if (!decimal) {
        return whole.toString();
    }

    return `${whole}.${decimal}`;
};


/**
 * Add two decimal amounts.
 */
const addAmounts = (a, b) => {
    return fromUnits(
        toUnits(a) + toUnits(b)
    );
};


/**
 * Subtract one decimal amount from another.
 */
const subtractAmounts = (a, b) => {
    const result =
        toUnits(a) - toUnits(b);

    if (result < 0n) {
        throw new Error(
            "Insufficient balance"
        );
    }

    return fromUnits(result);
};


/**
 * Compare two decimal amounts.
 *
 * Returns:
 *  1  if a > b
 *  0  if a === b
 * -1  if a < b
 */
const compareAmounts = (a, b) => {
    const aUnits = toUnits(a);
    const bUnits = toUnits(b);

    if (aUnits > bUnits) {
        return 1;
    }

    if (aUnits < bUnits) {
        return -1;
    }

    return 0;
};


/**
 * Check whether an amount is greater than zero.
 */
const isPositiveAmount = (amount) => {
    return toUnits(amount) > 0n;
};


module.exports = {
    DECIMAL_PLACES,
    toUnits,
    fromUnits,
    addAmounts,
    subtractAmounts,
    compareAmounts,
    isPositiveAmount
};