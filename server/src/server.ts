import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import instrumentsRouter from "./routes/instruments.routes.js";

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
  res.send(`This is your API`);
});

app.use("/auth", authRouter);
app.use("/instruments", instrumentsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
