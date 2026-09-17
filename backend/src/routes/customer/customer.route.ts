import express from "express";
import customerController from "./customer.controller";
const customerRoutes = express.Router();

customerRoutes.post("/", customerController.createCustomer);
customerRoutes.get("/", customerController.getCustomers);
customerRoutes.post("/payment", customerController.customerPayment);
customerRoutes.get("/:customerId", customerController.getCustomerById);
customerRoutes.put("/:customerId", customerController.updateCustomer);

export default customerRoutes;
