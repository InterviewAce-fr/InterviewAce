import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { ReportData } from "../types/report";

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "report.hbs");

// Charge et compile une fois
const templateSrc = fs.readFileSync(TEMPLATE_PATH, "utf8");
const template = Handlebars.compile(templateSrc, { noEscape: true });

export function renderReport(raw: Partial<ReportData> & any): string {
  const data: ReportData = normalize(raw);
  return template(data);
}

function normalize(raw: any): ReportData {
  // Compat: ancien "swot" -> "strategy"
  const strategy = raw.strategy ?? raw.swot ?? {};
  const generatedAt = raw.generatedAt ?? dayjs().format("DD MMM YYYY HH:mm");

  // Calcul score moyen si absent
  let matchScore = raw?.profileMatch?.matchScore;
  if (
    matchScore == null &&
    Array.isArray(raw?.profileMatch?.items) &&
    raw.profileMatch.items.length
  ) {
    const scored = raw.profileMatch.items
      .map((i: any) => (typeof i.score === "number" ? i.score : undefined))
      .filter((n: number | undefined) => typeof n === "number") as number[];
    if (scored.length) {
      matchScore = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
    }
  }

  return {
    generatedAt,
    candidate: { name: "", ...raw.candidate },
    role: { title: "", ...raw.role },
    company: { name: "", ...raw.company },
    strategy,
    profileMatch: raw.profileMatch
      ? {
          ...raw.profileMatch,
          matchScore,
        }
      : undefined,
    why: raw.why,
    interview: raw.interview,
  } as ReportData;
}
