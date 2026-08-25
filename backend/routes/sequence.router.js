import express from "express";
import {
  createSequence,
  getSequences,
  getSequence,
  updateSequence,
  deleteSequence,
  manageContacts,
  runSequence,
  getEligibleContacts,
  sendSingleSequenceEmail,
  sendTestSequenceEmail
} from "../controller/sequence.controller.js";

const router = express.Router();

router.get("/", getSequences);
router.post("/", createSequence);
router.post("/test-email", sendTestSequenceEmail);
router.get("/:id", getSequence);
router.patch("/:id", updateSequence);
router.delete("/:id", deleteSequence);
router.post("/:id/contacts", manageContacts);
router.post("/:id/run", runSequence);
router.get("/:id/eligible", getEligibleContacts);
router.post("/:id/send-single", sendSingleSequenceEmail);

export default router;
