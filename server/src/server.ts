import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import instrumentsRouter from "./routes/instruments.routes.js";
import marketRouter from "./routes/market.routes.js";
import watchlistRouter from "./routes/watchlist.routes.js";
import profileRouter from "./routes/profile.routes.js";
import walletRouter from "./routes/wallet.route.js";
import tradingRouter from "./routes/trading.route.js";
import indicesRouter from "./routes/indices.route.js";
import contactRouter from "./routes/contact.routes.js";
import adminRouter from "./routes/admin.routes.js";
import "./utils/tokenCleanup.js"; // Start token cleanup tasks

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 8080;

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" && process.env.CLIENT_BASE_URL
        ? process.env.CLIENT_BASE_URL
        : (origin, callback) => {
            if (!origin) return callback(null, true);
            return callback(null, origin);
          },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.send(`This is your Trading API`);
});

app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/auth", authRouter);
app.use("/instruments", instrumentsRouter);
app.use("/market", marketRouter);
app.use("/watchlist", watchlistRouter);
app.use("/profile", profileRouter);
app.use("/wallet", walletRouter);
app.use("/trading", tradingRouter);
app.use("/api/indices", indicesRouter);
app.use("/contact", contactRouter);
app.use("/admin", adminRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Trading Server is running on port ${PORT}`);
});
