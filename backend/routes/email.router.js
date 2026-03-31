import express from "express"
import { sendEmail, test } from "../controller/sendEmail.controller.js";

const emailRouter = express.Router();


emailRouter.post("/send" , sendEmail) 


export default emailRouter