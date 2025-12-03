import express from "express";
import cors from "cors";
import "dotenv/config";
import { githubRouter } from "./routes/github";

const app = express();

// CORS configuration for production
// CORS_ORIGIN: exact origin (e.g., "https://spectral-diff.vercel.app" - no trailing slash)
// CORS_ORIGIN_REGEX: anchored regex for preview URLs (e.g., "^https://spectral-diff(-[a-z0-9-]+)?\\.vercel\\.app$")
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const CORS_ORIGIN_REGEX_RAW = process.env.CORS_ORIGIN_REGEX;

const allowedOrigins = [
  CORS_ORIGIN,
  "http://localhost:3000", // Local dev
].filter(Boolean) as string[];

// Build and validate regex for preview URLs
let originRegex: RegExp | null = null;
if (CORS_ORIGIN_REGEX_RAW) {
  // Validate regex is properly anchored and targets vercel.app to prevent ".*" accidents
  if (!CORS_ORIGIN_REGEX_RAW.startsWith("^https://") || !CORS_ORIGIN_REGEX_RAW.includes("vercel\\.app")) {
    throw new Error(
      "CORS_ORIGIN_REGEX must start with ^https:// and target vercel\\.app. " +
      "Example: ^https://spectral-diff(-[a-z0-9-]+)?\\.vercel\\.app$"
    );
  }
  originRegex = new RegExp(CORS_ORIGIN_REGEX_RAW);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (health checks, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check regex match for Vercel preview URLs
    if (originRegex && originRegex.test(origin)) {
      return callback(null, true);
    }
    
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  // Explicitly allow our custom header and methods
  allowedHeaders: ["Content-Type", "x-gh-token"],
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  // credentials: false since we use header token, not cookies
  credentials: false,
}));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "spectral-diff-api" });
});

// GitHub API proxy routes
app.use("/gh", githubRouter);

const port = Number(process.env.PORT ?? 5050);
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
