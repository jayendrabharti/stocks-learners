import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import instrumentsRouter from "./routes/instruments.routes.js";
import walletRouter from "./routes/wallet.routes.js";
import tradingRouter from "./routes/trading.routes.js";
import watchlistRouter from "./routes/watchlist.routes.js";
import marketRouter from "./routes/market.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 6900;

app.use(
  cors({
    origin: (origin, callback) => {
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

// Authentication routes
app.use("/auth", authRouter);

// Existing routes
app.use("/instruments", instrumentsRouter);

// Trading system routes
app.use("/wallet", walletRouter);
app.use("/trading", tradingRouter);
app.use("/watchlist", watchlistRouter);
app.use("/market", marketRouter);

app.listen(PORT, () => {
  console.log(`🚀 Trading Server is running on port ${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   • Auth: /auth/*`);
  console.log(`   • Wallet: /wallet/*`);
  console.log(`   • Trading: /trading/*`);
  console.log(`   • Watchlist: /watchlist/*`);
  console.log(`   • Market: /market/*`);
});
