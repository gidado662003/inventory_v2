import express from "express";
import authRoutes from "./routes/auth/auth.route";
import productRoutes from "./routes/product/product.route";
import movementRoutes from "./routes/inventory-movement/movement.route";
import saleRoutes from "./routes/sale/sale.route";
import paymentRoutes from "./routes/payment/payment.route";
import customerRoutes from "./routes/customer/customer.route";
import dashboardRoutes from "./routes/dashboard/dashboard.route";
import { requireAuth } from "./middleware/requireAuth";

const allRoutes = express.Router();

allRoutes.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
  });
});

allRoutes.get("/debug/db-config", (_req, res) => {
  res.json({
    databaseUrlExists: Boolean(process.env.DATABASE_URL),
    databaseUrlLooksValid:
      process.env.DATABASE_URL?.startsWith("postgresql://") ||
      process.env.DATABASE_URL?.startsWith("postgres://"),
    nodeEnv: process.env.NODE_ENV,
  });
});

allRoutes.use("/auth", authRoutes);
allRoutes.use(requireAuth);
allRoutes.use("/product", productRoutes);
allRoutes.use("/movements", movementRoutes);
allRoutes.use("/sales", saleRoutes);
allRoutes.use("/payment", paymentRoutes);
allRoutes.use("/customer", customerRoutes);
allRoutes.use("/dashboard", dashboardRoutes);

export default allRoutes;
