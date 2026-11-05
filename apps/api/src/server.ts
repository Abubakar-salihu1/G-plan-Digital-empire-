import "dotenv/config";
import express, { type Request } from "express";
import { timingSafeEqual } from "node:crypto";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: allowedOrigin.split(",").map((v) => v.trim()), credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", service: "g-plan-api", version: "0.1.0", timestamp: new Date().toISOString() });
});

app.get("/api/v1/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", checks: { database: "connected" } });
  } catch {
    res.status(503).json({ status: "not_ready", checks: { database: "unavailable" } });
  }
});

app.get("/api/v1/services", (_req, res) => {
  res.json({ data: [
    { slug: "ai-marketing", name: "AI Marketing", description: "Strategy, content and campaign support." },
    { slug: "creative-studio", name: "Creative Studio", description: "Brand design, graphics and video production." },
    { slug: "automation", name: "Business Automation", description: "Practical workflow and customer support automation." },
    { slug: "business-intelligence", name: "Business Intelligence", description: "Analytics, reporting and growth insights." }
  ], source: "application_catalog" });
});

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  service: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10).max(3000)
});
app.post("/api/v1/enquiries", async (req, res) => {
  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_enquiry", details: parsed.error.flatten() });
    return;
  }
  try {
    const enquiry = await prisma.enquiry.create({ data: parsed.data });
    res.status(201).json({ data: { id: enquiry.id, status: enquiry.status, createdAt: enquiry.createdAt }, message: "Enquiry received." });
  } catch {
    res.status(500).json({ error: "enquiry_creation_failed", message: "The enquiry could not be saved. Please try again." });
  }
});

function isAdmin(req: Request): boolean {
  const key = process.env.ADMIN_KEY ?? "";
  if (key.length < 16) return false;
  const given = Buffer.from(String(req.headers["x-admin-key"] ?? ""));
  const expected = Buffer.from(key);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
app.get("/api/v1/admin/enquiries", async (req, res) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    const data = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ data });
  } catch {
    res.status(500).json({ error: "could_not_load_enquiries" });
  }
});

const statusSchema = z.object({ status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "SPAM"]) });
app.patch("/api/v1/admin/enquiries/:id", async (req, res) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_status" });
    return;
  }
  try {
    const data = await prisma.enquiry.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
    res.json({ data });
  } catch {
    res.status(404).json({ error: "not_found" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});
const server = app.listen(port, () => console.log(`G-PLAN API listening on :${port}`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
