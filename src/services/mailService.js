require("dotenv").config();
const { BrevoClient } = require("@getbrevo/brevo");

const client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
});

const sendEmail = async ({
    to,
    toName,
    subject,
    htmlContent,
    textContent,
}) => {
    const response =
        await client.transactionalEmails.sendTransacEmail({
            htmlContent,
            textContent,
            sender: {
                email: process.env.BREVO_SENDER_EMAIL,
                name: process.env.BREVO_SENDER_NAME,
            },
            subject,
            to: [
                {
                    email: to,
                    name: toName || undefined,
                },
            ],
        });

    // console.log("Brevo email sent:", response);

    return response;
};

module.exports = {
    sendEmail,
};