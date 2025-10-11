const nodemailer = require('nodemailer');
const path = require('path')

const sendMail = async (recepient, cc, subject, content, fileUrl) => {
    try {
        console.log('fileUrl',fileUrl);
        
        // const attachmentPath = path.join(__dirname, "../uploads/Hariharan A Resume_0f75505b-78e6-49b7-ab7e-04c4641ebd77.pdf")
        const transport = nodemailer.createTransport({
            service: "gmail",
            secure: true,
            port: 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        })
        const mailInfo = {
            from: process.env.EMAIL_USER,
            to: recepient,
            cc,
            subject: subject,
            text: content,
            attachments : fileUrl ?
            [{ filename: `${subject}`, path: fileUrl }] : []
        }
        console.log('sendMail.js : MailInfo to be sent', mailInfo);

        const info = await transport.sendMail(mailInfo);

        console.log("sendMail.js : mail sent successfully", info.messageId);

        cc = cc ? `/ cc: ${cc}` : ''
        if (info.messageId) {
            return `Mail Sent Successfully to: ${recepient} ${cc}`;
        }
        return `Failed to Send Mail to: ${recepient} ${cc}`;
    } catch (error) {
        console.error('nodeMailer.js: sendMail => Issue while sending mail to the client', error);
        throw error
    }
}

module.exports = { sendMail }