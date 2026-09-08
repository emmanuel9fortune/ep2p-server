const validator = require("validator");

const validateRegistration = ({
    firstName,
    lastName,
    email,
    phone,
    password
}) => {
    const errors = {};

    if (!firstName || !firstName.trim()) {
        errors.firstName = "First name is required";
    }

    if (!lastName || !lastName.trim()) {
        errors.lastName = "Last name is required";
    }

    if (!email || !validator.isEmail(email)) {
        errors.email = "A valid email address is required";
    }

    if (!phone || !validator.isMobilePhone(phone, "any")) {
        errors.phone = "A valid phone number is required";
    }

    if (!password) {
        errors.password = "Password is required";
    } else if (password.length < 8) {
        errors.password = "Password must be at least 8 characters";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

module.exports = {
    validateRegistration
};