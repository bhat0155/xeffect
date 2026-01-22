import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import passport from "passport";
import swaggerUi from "swagger-ui-express";

import { configurePassport } from "./config/passport";
import authRoutes from "./routes/auth.routes";
import habitRoutes from "./routes/habits.route";
import { openapiSpec } from "./docs/openapi";
import publicRoutes from "./routes/public.routes"

dotenv.config();

export const app = express();

// trust render proxy
app.set("trust proxy", 1);

// middleware
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// auth + routes
configurePassport();
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ ok: true, message: "Sab changa si" });
});

app.use("/api/habits", habitRoutes);
app.use("/api/public", publicRoutes);

// 404 error handler
app.use((req, res)=>{
  res.status(404).json({ code: "NOT_FOUND", message: "Route not found" });
})

app.use((err: unknown, req: Request, res: Response, _next: NextFunction)=>{
    console.log(err);
  res.status(500).json({ code: "SERVER_ERROR", message: "Something went wrong" });
})