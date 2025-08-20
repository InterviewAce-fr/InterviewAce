// server/routes/whySuggestions.ts
import { Router } from "express";
import { z } from "zod";
import { generateWhySuggestions } from "../services/aiService.server";
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// --- Auth middleware --------------------------------
async function requireAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    // Vérification via Supabase (option 1)
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // attache l’utilisateur dans req
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}

// --- Zod schemas ------------------------------------
const StringArray = z.array(z.any()).transform((arr) =>
  (Array.isArray(arr) ? arr : []).map((item: any) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object") {
      return (
        item.name ||
        item.title ||
        item.skill ||
        item.label ||
        item.company ||
        item.university ||
        JSON.stringify(item)
      ).toString();
    }
    return String(item ?? "");
  }).filter(Boolean)
);

const PayloadSchema = z.object({
  cv: z.object({
    skills: StringArray,
    education: StringArray,
    experience: StringArray,
  }),
  job: z.object({
    requirements: StringArray,
    responsibilities: StringArray,
  }).passthrough(),
  matches: z.object({
    overallScore: z.number().optional(),
    matches: z.array(z.object({
      targetType: z.enum(["requirement", "responsibility"]),
      targetIndex: z.number(),
      targetText: z.string(),
      skill: z.string(),
      grade: z.enum(["High", "Moderate", "Low"]),
      score: z.number(),
      reasoning: z.string(),
    })).default([]),
  }).optional(),
  swotAndBmc: z.object({
    strengths: StringArray.default([]),
    weaknesses: StringArray.default([]),
    opportunities: StringArray.default([]),
    threats: StringArray.default([]),
    bmc: z.object({
      valuePropositions: StringArray.default([]),
      customerSegments: StringArray.default([]),
      keyActivities: StringArray.default([]),
      keyResources: StringArray.default([]),
      channels: StringArray.default([]),
    }).default({}),
    matches: z.any().optional(),
  }).default({}),
});

// --- Route ------------------------------------------
router.post("/why-suggestions", authenticateToken, async (req, res) => {
  try {
    const payload = PayloadSchema.parse(req.body);
    const suggestions = await generateWhySuggestions(payload);
    res.json({
      whyCompany: suggestions.whyCompany ?? "",
      whyRole: suggestions.whyRole ?? "",
      whyYou: suggestions.whyYou ?? "",
    });
  } catch (err: any) {
    console.error("why-suggestions error", err);
    res.status(400).json({ error: err?.message ?? "Invalid request" });
  }
});

export default router;
