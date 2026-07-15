import express from "express";
import {
  getContacts,
  filterContacts,
  getContactById,
  updateContact,
  bulkUpdateContacts,
  getContactStats,
  createContact,
} from "../controller/contact.controller.js";
import { sendToContacts, sendFollowup } from "../controller/emailAction.controller.js";

const contactRouter = express.Router();

// Contact routes
contactRouter.get("/stats", getContactStats);
contactRouter.get("/filter", filterContacts);
contactRouter.get("/:id", getContactById);
contactRouter.get("/", getContacts);
contactRouter.post("/", createContact);
contactRouter.patch("/bulk", bulkUpdateContacts);
contactRouter.patch("/:id", updateContact);

// Email action routes
contactRouter.post("/emails/send", sendToContacts);
contactRouter.post("/emails/followup", sendFollowup);

export default contactRouter;
