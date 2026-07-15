const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `"To-Do App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verify your email</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #4f46e5; letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire soon. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };