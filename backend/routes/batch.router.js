import express from "express";
import {
  createBatch,
  getSequenceBatches,
  updateBatch,
  deleteBatch,
  runSchedulerManual
} from "../controller/batch.controller.js";

const router = express.Router();

router.post("/", createBatch);
router.get("/sequence/:sequenceId", getSequenceBatches);
router.patch("/:id", updateBatch);
router.delete("/:id", deleteBatch);
router.post("/scheduler/run", runSchedulerManual);

export default router;
