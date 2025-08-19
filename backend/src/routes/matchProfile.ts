import { Router } from "express";
import { z } from "zod";
import { matchProfile } from "../services/aiService.server";

const router = Router();

const PayloadSchema = z.object({
  requirements: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  experience: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
});

router.post("/match-profile", async (req, res) => {
  try {
    const payload = PayloadSchema.parse(req.body);

    const result = await matchProfile(payload);

    // Normalise/valide le format attendu par l’UI
    const normalized = {
      overallScore: Math.max(0, Math.min(100, Math.round(result.overallScore ?? 0))),
      matches: Array.isArray(result.matches)
        ? result.matches.map((m: any) => ({
            skill: String(m.skill ?? m.source ?? m.target ?? "—"),
            grade: ((): "High" | "Moderate" | "Low" => {
              const g = String(m.grade ?? "").toLowerCase();
              if (g.startsWith("high")) return "High";
              if (g.startsWith("moder")) return "Moderate";
              if (g.startsWith("low")) return "Low";
              const s = Number(m.score ?? 0);
              if (s >= 75) return "High";
              if (s >= 50) return "Moderate";
              return "Low";
            })(),
            score: Math.max(0, Math.min(100, Math.round(Number(m.score ?? 0)))),
            reasoning: String(m.reasoning ?? ""),
          }))
        : [],
      distribution: ((): { high: number; moderate: number; low: number } => {
        const dist = { high: 0, moderate: 0, low: 0 };
        for (const m of (Array.isArray(result.matches) ? result.matches : [])) {
          const s = Number(m.score ?? 0);
          if (s >= 75) dist.high++;
          else if (s >= 50) dist.moderate++;
          else dist.low++;
        }
        return dist;
      })(),
    };

    // Optionnel : désactiver tout cache
    // res.set("Cache-Control", "no-store");

    res.json(normalized);
  } catch (err: any) {
    console.error("match-profile error", err);
    res.status(400).json({ error: err?.message ?? "Invalid request" });
  }
});

export default router;
