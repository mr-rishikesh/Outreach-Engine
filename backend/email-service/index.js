import dotenv from "dotenv";

dotenv.config();
import nodemailer from "nodemailer"
// import { prompts } from "../ai-service/prompt.js";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const sendEmailsNodemailer = async ({subject , bdy  } , email) => {
   

    const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email ,
    subject: subject,
    text: bdy,

     
  };
  try {
    await transporter.sendMail(mailOptions);
    return {seccess : true}
  } catch (error) {
    console.log("error wile sending email " , error)
     return {seccess : false}
  }
 


}
