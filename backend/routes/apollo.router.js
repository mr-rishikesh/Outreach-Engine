import express from "express";
import { searchLeads, importLeads } from "../controller/apollo.controller.js";

const apolloRouter = express.Router();

// Route to search leads directly from Apollo API
apolloRouter.post("/search", searchLeads);

// Route to import selected leads to the local database
apolloRouter.post("/import", importLeads);

export default apolloRouter;
