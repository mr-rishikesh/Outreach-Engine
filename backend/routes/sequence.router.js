import express from "express";
import {
  createSequence,
  getSequences,
  getSequence,
  updateSequence,
  deleteSequence,
  manageContacts,
  runSequence
} from "../controller/sequence.controller.js";

const router = express.Router();

router.get("/", getSequences);
router.post("/", createSequence);
router.get("/:id", getSequence);
router.patch("/:id", updateSequence);
router.delete("/:id", deleteSequence);
router.post("/:id/contacts", manageContacts);
router.post("/:id/run", runSequence);

export default router;
