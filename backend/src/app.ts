import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import morgan from "morgan";
import allRoutes from "./api";

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api", allRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
