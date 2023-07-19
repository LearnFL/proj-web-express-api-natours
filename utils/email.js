// NODEMAILER NAD MAILTRAP SERVICE
import nodemailer from 'nodemailer';
import {} from 'dotenv/config';
import pug from 'pug';
import { currDir } from '../helper.js';
import { htmlToText } from 'html-to-text';

const __dirname = currDir();

// export const sendEmail = async (options) => {
//   // 1) Create transporter (service that sends email)
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // 2) Define email options
//   const mailOptions = {
//     from: 'Natours <ot@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html: html
//   };

//   // 3) Send email
//   await transporter.sendMail(mailOptions);
// };

export default class Email {
  #from;
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.#from = `Admin Natours <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return 1;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML based template

    const html = pug.renderFile(`${__dirname}/views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define options for email
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html), // npm i html-to-text
    };

    // 3) Create a transport and send email
    await this.createTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token. Valid for 10 minutes'
    );
  }
}
