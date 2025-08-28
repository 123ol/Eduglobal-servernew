import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, resetUrl }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; padding:20px;">
      <h2 style="color:#2c3e50;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You requested to reset your password. Please click the button below to reset it:</p>
      <a href="${resetUrl}" 
         style="display:inline-block; margin:10px 0; padding:10px 20px; background:#3498db; color:#fff; text-decoration:none; border-radius:5px;">
         Reset Password
      </a>
      <p>If the button above does not work, copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
      <br/>
      <p>Thanks,<br/>Your App Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Your App Name" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlTemplate,
  });
};

export default sendEmail;
