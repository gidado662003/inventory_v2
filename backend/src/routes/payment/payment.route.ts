import express from "express";
import { paymentController } from "./payment.controller";
const paymentRoutes = express.Router();

paymentRoutes.post("/", paymentController.createPayment);
paymentRoutes.get("/", paymentController.getPayments);
paymentRoutes.get("/sale/:saleId", paymentController.getPaymentsForSale);
paymentRoutes.get(
  "/customer/:customerId",
  paymentController.getPaymentsByCustomer,
);
export default paymentRoutes;
