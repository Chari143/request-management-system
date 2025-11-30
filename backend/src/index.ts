import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import requestRoutes from "./routes/requests";
import { config } from "./config";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api", requestRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});

