import { generateInternshipEmail } from "../ai-service/groqservice.js";
import { formate } from "../email-service/email.body.format.js";
import { sendEmailsNodemailer } from "../email-service/index.js";
import Contacts from "../models/Contacts.js";
import { migrate } from "./migration.js";
import { isBlockedDomain } from "../utils/blockedDomains.js";
export const test = async (req , res ) => {
  try {
    await  migrate()
       return  res.json({ messsage: "sent to all users" });
  } catch (error) {
        console.log(error);
    res.json({ message: "erro in sendemi", error });
    
  }
}
export const sendEmail = async (req, res) => {
  let thankq = [
    "Thanks",
    "Thank You",
    "Thanks..",
    "Thank You..",
    "Thank You so much for Considering",
    "Thank a lot",
    "Thanks for considering",
    "Thank You...",
    "Thanks....",
    "Thanks ..",
    "Thank you so much ... ",
  ];

  let random = Math.floor(Math.random() * 10) % 10;
  console.log("thank", thankq[0]);

  try {
    // const users = await Contacts.find({});
    const users = [];
    let sent = false;

    let names = [];
    
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 99);
  
    for (const user of users) {
      if (isBlockedDomain(user.email)) continue;

      if (user.lastSentDate < twentyDaysAgo) {
        const { subject, body } = await generateInternshipEmail(user);
        const bdy = await formate(body, user, thankq[random]);

        // await sendEmailsNodemailer({ subject, bdy }, user.email);

        // const updateUser = await Contacts.findByIdAndUpdate(
        //   user._id,
        //   { lastSentDate: new Date() },
        //   { new: true }
        // );
        names.push(user.firstName)

        // ✅ stop after one email 
       await new Promise((resolve) => setTimeout(resolve, 20000));
    

      }
  
    }

    return  res.json({ messsage: "sent to all users" , names });

   
  } catch (error) {
    console.log(error);
    res.json({ message: "erro in sendemi", error });
  }
};
