// NODEMAILER NAD MAILTRAP SERVICE
import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  // 1) Create transporter (service that sends email)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define email options
  const mailOptions = {
    from: 'Natours <ot@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: html
  };

  // 3) Send email
  await transporter.sendMail(mailOptions);
};
