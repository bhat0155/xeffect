import express, {Request, Response} from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { configurePassport } from "./config/passport";
import passport from "passport";
import authRoutes from "./routes/auth.routes";
import { requireAuth } from "./middlewares/requireAuth";
import habitRoutes from "./routes/habits.route";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(helmet());
app.use(cors({
    origin: FRONTEND_ORIGIN,
    credentials: true
}))
app.use(cookieParser());
app.use(express.json())

configurePassport();
app.use(passport.initialize())

app.use("/auth", authRoutes)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// health route
app.get("/health", (req: Request, res: Response)=>{
    res.status(200).json({ok: true, message: "Sab changa si"})
})

app.use("/api/habits", habitRoutes);
app.use("/api/public", habitRoutes)



app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})
