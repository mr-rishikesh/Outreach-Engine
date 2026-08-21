import express from "express";
import {
  getCompanies,
  getCompanyStats,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../controller/company.controller.js";

const companyRouter = express.Router();

companyRouter.get("/stats", getCompanyStats);
companyRouter.get("/:id", getCompanyById);
companyRouter.get("/", getCompanies);
companyRouter.patch("/:id", updateCompany);
companyRouter.delete("/:id", deleteCompany);

export default companyRouter;
