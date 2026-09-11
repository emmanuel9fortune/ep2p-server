const fs = require("fs");
const path = require("path");

const {
    sendEmail,
} = require("./mailService");

const sendVerificationOTP = async ({
    email,
    firstName,
    otp,
}) => {

    const templatePath = path.join(
        __dirname,
        "../mailer/otpMailer.html"
    );

    let htmlContent = fs.readFileSync(
        templatePath,
        "utf8"
    );

    const expiryMinutes = 10;
    const appName =
        process.env.APP_NAME || "Your Platform";

    const supportEmail =
        process.env.SUPPORT_EMAIL ||
        process.env.BREVO_SENDER_EMAIL;

    const year = new Date().getFullYear();

    htmlContent = htmlContent
        .replace(
            /{{firstName}}/g,
            firstName || "there"
        )
        .replace(
            /{{otp}}/g,
            otp
        )
        .replace(
            /{{expiryMinutes}}/g,
            expiryMinutes
        )
        .replace(
            /{{appName}}/g,
            appName
        )
        .replace(
            /{{supportEmail}}/g,
            supportEmail
        )
        .replace(
            /{{year}}/g,
            year
        );

    const textContent = `
        Hello ${firstName || "there"},

        Use the verification code below to complete your account setup.

        Your verification code is:

        ${otp}

        This code expires in ${expiryMinutes} minutes.

        If you did not request this verification code,
        you can safely ignore this email.

        Never share your verification code with anyone.

        © ${year} ${appName}
        `;

    
    return sendEmail({
        to: email,
        toName: firstName,
        subject: "Verify your account",
        htmlContent,
        textContent,
    });
};


module.exports = {
    sendVerificationOTP,
};