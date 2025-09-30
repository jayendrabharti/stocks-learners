import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import instrumentsRouter from "./routes/instruments.routes.js";
import marketRouter from "./routes/market.routes.js";
import watchlistRouter from "./routes/watchlist.routes.js";
import profileRouter from "./routes/profile.routes.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 8080;

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Trading Server is running on port ${PORT}`);
});
