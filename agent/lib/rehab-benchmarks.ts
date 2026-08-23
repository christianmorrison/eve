import type { ParsedSow, SowLineItem } from "./sow-parser.js";

// Installed-cost benchmarks (labor + materials) keyed to FlipCo's fixed
// line-item vocabulary. Ranges are national baselines for a typical
// 1,000–1,600 sqft single-family rehab, scaled by a regional factor.
//
// Baseline v0: curated 2026-08 from published installed-cost guides
// (Homewyse/Fixr/Angi-class data). Entries are screening bands, not bids —
// the review policy escalates big or out-of-band lines to live, zip-local
// lookups, and a scheduled refresh can re-anchor this table monthly.

type Unit = "flat" | "per_sqft_floor" | "per_unit";

interface Benchmark {
  unit: Unit;
  low: number;
  high: number;
  /** For per_unit entries: fallback flat range when no count is stated. */
  flatLow?: number;
  flatHigh?: number;
  note: string;
  /** Details text often changes expected scope (repair vs full replace). */
  scopeSensitive?: boolean;
}

const BENCHMARKS: Record<string, Benchmark> = {
  Permits: { unit: "flat", low: 400, high: 2500, note: "Varies by municipality and scope." },
  Architectural: { unit: "flat", low: 800, high: 5000, note: "Only when plans are required." },
  Engineering: { unit: "flat", low: 500, high: 3000, note: "Structural letters/plans." },
  Legal: { unit: "flat", low: 300, high: 2000, note: "Rarely used on SFR rehab." },
  Demolition: { unit: "flat", low: 4000, high: 12000, note: "Full interior gut + dumpsters for small SFR.", scopeSensitive: true },
  "Foundation + Driveway": { unit: "flat", low: 8000, high: 25000, note: "Composite line: structural repair ranges are bid-driven; request itemized bids.", scopeSensitive: true },
  Foundation: { unit: "flat", low: 4000, high: 20000, note: "Joist/pier/subfloor repair is bid-driven.", scopeSensitive: true },
  "HVAC Rough": { unit: "flat", low: 6000, high: 11000, note: "Full system replacement (condenser + air handler/furnace)." },
  "HVAC Trim": { unit: "flat", low: 400, high: 1500, note: "Registers, thermostat, startup." },
  "HVAC Service/Repair": { unit: "flat", low: 200, high: 900, note: "Service call + minor repair." },
  "Electrical Service": { unit: "flat", low: 1500, high: 3500, note: "Panel/service upgrade." },
  "Electrical Rough": { unit: "flat", low: 1000, high: 4500, note: "Partial rewire, outlets, recessed cans.", scopeSensitive: true },
  "Electrical Final/ Fixtures": { unit: "flat", low: 300, high: 1500, note: "Fixture installation." },
  "Plumbing Rough": { unit: "flat", low: 800, high: 3500, note: "Partial re-route/new lines.", scopeSensitive: true },
  "Plumbing Top Out": { unit: "flat", low: 500, high: 2000, note: "Mid-stage plumbing." },
  "Plumbing Final/ Fixtures": { unit: "flat", low: 500, high: 2000, note: "Set fixtures (tub, vanity, sinks, DW)." },
  Windows: { unit: "per_unit", low: 300, high: 650, flatLow: 3000, flatHigh: 8000, note: "Per vinyl replacement window, installed." },
  "Interior Doors": { unit: "per_unit", low: 150, high: 450, flatLow: 800, flatHigh: 3500, note: "Per interior door w/ hardware; exterior doors run $400–1,200 each.", scopeSensitive: true },
  "Interior Trim": { unit: "flat", low: 1000, high: 3500, note: "Base/case for small SFR." },
  Insulation: { unit: "flat", low: 1500, high: 4500, note: "Crawl space or attic re-insulation, small SFR." },
  Drywall: { unit: "per_sqft_floor", low: 2.0, high: 3.5, flatLow: 500, flatHigh: 2500, note: "Full hang+finish per floor sqft; repairs run $500–2,500.", scopeSensitive: true },
  "Interior Paint": { unit: "flat", low: 2000, high: 4800, note: "Full interior repaint, small SFR." },
  "Tile Flooring": { unit: "flat", low: 1500, high: 6000, note: "Depends on area; ~$8–15/sqft installed.", scopeSensitive: true },
  Carpet: { unit: "flat", low: 1000, high: 4000, note: "~$2–5/sqft installed.", scopeSensitive: true },
  "LVP Flooring": { unit: "per_sqft_floor", low: 3.5, high: 7.0, note: "Whole-house LVP installed per floor sqft." },
  "Kitchen Countertops": { unit: "flat", low: 1800, high: 4200, note: "Granite, small kitchen (~30–40 sqft)." },
  "Kitchen Cabinets": { unit: "flat", low: 3000, high: 8500, note: "Stock cabinets installed, small kitchen." },
  Backsplash: { unit: "flat", low: 600, high: 1800, note: "Subway tile backsplash." },
  Appliances: { unit: "flat", low: 2000, high: 4500, note: "Stainless package: range, fridge, DW, micro." },
  "Bathroom Cabinets": { unit: "flat", low: 400, high: 1200, note: "Vanity + top installed." },
  "Bathroom Vanity Tops": { unit: "flat", low: 200, high: 800, note: "Top only." },
  "Showers Tile": { unit: "flat", low: 1500, high: 4200, note: "Tub/shower tile wall surround." },
  Tubs: { unit: "flat", low: 700, high: 2000, note: "New tub installed." },
  "Door and Cabinet Handles": { unit: "flat", low: 100, high: 500, note: "Pulls and knobs." },
  Mirrors: { unit: "flat", low: 50, high: 350, note: "Bath mirror(s)." },
  "Shower Glass": { unit: "flat", low: 400, high: 1500, note: "Tub/shower glass door." },
  "Fire Place": { unit: "flat", low: 500, high: 3000, note: "Facing/repair, not new install.", scopeSensitive: true },
  "Masonry/ Stucco": { unit: "flat", low: 1000, high: 8000, note: "Bid-driven.", scopeSensitive: true },
  Roofing: { unit: "flat", low: 5000, high: 9500, note: "Full asphalt-shingle replacement, ~1,200 sqft ranch (~16–18 squares)." },
  Framing: { unit: "flat", low: 300, high: 2500, note: "Spot repairs (soffit, fascia, openings).", scopeSensitive: true },
  Siding: { unit: "flat", low: 6000, high: 12500, note: "Full vinyl siding, small SFR." },
  "Exterior Paint": { unit: "flat", low: 2500, high: 6000, flatLow: 300, flatHigh: 1500, note: "Full repaint; partial (trim/shutters) runs $300–1,500.", scopeSensitive: true },
  "Exterior Doors": { unit: "per_unit", low: 400, high: 1200, flatLow: 800, flatHigh: 2500, note: "Per exterior door, installed." },
  "Finish kitchen Hardware": { unit: "flat", low: 100, high: 500, note: "Hardware only." },
  "Driveway/ Flatwork": { unit: "flat", low: 4000, high: 9500, note: "Concrete single drive + walk (~$6–12/sqft)." },
  "Pressure Wash": { unit: "flat", low: 200, high: 600, note: "House + flatwork." },
  Landscaping: { unit: "flat", low: 800, high: 3500, note: "Trim, beds, basic curb appeal." },
  "Decks/ Patio": { unit: "flat", low: 1000, high: 6000, note: "Repairs; new construction runs $30–60/sqft.", scopeSensitive: true },
  "Rain Gutters": { unit: "flat", low: 500, high: 1800, note: "Aluminum gutters, small SFR." },
  "Sprinkler System": { unit: "flat", low: 1500, high: 5000, note: "New install, small yard." },
  Fencing: { unit: "flat", low: 1500, high: 6000, note: "Depends on length/material.", scopeSensitive: true },
  "Rough Clean": { unit: "flat", low: 200, high: 500, note: "Mid-project clean." },
  "Final Clean": { unit: "flat", low: 200, high: 650, note: "Move-in clean." },
};

// Approximate residential-construction location factors (national = 1.0).
const REGION_FACTORS: Record<string, number> = {
  NC: 0.93, SC: 0.92, GA: 0.95, TN: 0.92, VA: 0.98, FL: 1.0, TX: 0.95,
  AL: 0.9, MS: 0.88, OH: 0.95, PA: 1.02, NY: 1.28, NJ: 1.18, CA: 1.32,
  WA: 1.15, CO: 1.05, AZ: 0.98, IL: 1.08,
};

export type Verdict =
  | "agree"
  | "flag_high"
  | "disagree_high"
  | "flag_low"
  | "scope_check"
  | "no_benchmark";

export interface LineAssessment {
  section: string;
  item: string;
  details: string;
  amount: number;
  expectedLow: number | null;
  expectedHigh: number | null;
  basis: string;
  verdict: Verdict;
  reason: string;
}

export interface SowAssessment {
  regionFactor: number;
  lines: LineAssessment[];
  structuralFindings: string[];
  totals: {
    totalBudget: number | null;
    computedTotal: number;
    perSqft: number | null;
    contingency: number;
    contingencyPct: number;
  };
}

function extractCount(details: string): number | null {
  const m = details.match(/(\d+)\s/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 && n < 100 ? n : null;
}

function assessLine(
  line: SowLineItem,
  sqft: number | null,
  factor: number,
): LineAssessment {
  const bench = BENCHMARKS[line.item];
  const base = {
    section: line.section,
    item: line.item,
    details: line.details,
    amount: line.amount,
  };
  if (!bench) {
    return {
      ...base,
      expectedLow: null,
      expectedHigh: null,
      basis: "No benchmark for this line.",
      verdict: "no_benchmark",
      reason: "Review manually or price live.",
    };
  }

  let low: number | null = null;
  let high: number | null = null;
  let basis = bench.note;

  if (bench.unit === "flat") {
    low = bench.low * factor;
    high = bench.high * factor;
  } else if (bench.unit === "per_sqft_floor") {
    if (sqft) {
      low = bench.low * sqft * factor;
      high = bench.high * sqft * factor;
      basis = `${bench.note} Scaled to ${sqft} sqft.`;
    } else if (bench.flatLow != null && bench.flatHigh != null) {
      low = bench.flatLow * factor;
      high = bench.flatHigh * factor;
    }
  } else {
    const count = extractCount(line.details);
    if (count) {
      low = bench.low * count * factor;
      high = bench.high * count * factor;
      basis = `${bench.note} Count of ${count} read from details.`;
    } else if (bench.flatLow != null && bench.flatHigh != null) {
      low = bench.flatLow * factor;
      high = bench.flatHigh * factor;
      basis = `${bench.note} No count stated; whole-house fallback range.`;
    }
  }

  if (low == null || high == null) {
    return {
      ...base,
      expectedLow: null,
      expectedHigh: null,
      basis,
      verdict: "no_benchmark",
      reason: "Could not scale a range; review manually.",
    };
  }

  low = Math.round(low);
  high = Math.round(high);
  const a = line.amount;
  let verdict: Verdict;
  let reason: string;

  if (a <= high * 1.2 && a >= low * 0.6) {
    verdict = "agree";
    reason = "Within the expected installed-cost band.";
  } else if (a > high * 1.5) {
    verdict = "disagree_high";
    reason = `More than 50% above the expected high of ~$${high.toLocaleString()}.`;
  } else if (a > high * 1.2) {
    verdict = "flag_high";
    reason = `Above the expected high of ~$${high.toLocaleString()}; ask for a bid or justification.`;
  } else if (bench.scopeSensitive) {
    verdict = "scope_check";
    reason =
      "Below the full-scope band — likely partial scope (see details). Confirm scope matches the price.";
  } else {
    verdict = "flag_low";
    reason = `Below the expected low of ~$${low.toLocaleString()}; possible underfunding risk.`;
  }

  return { ...base, expectedLow: low, expectedHigh: high, basis, verdict, reason };
}

export function assessSow(parsed: ParsedSow): SowAssessment {
  const factor = (parsed.project.state && REGION_FACTORS[parsed.project.state]) || 1.0;
  const sqft = parsed.project.sqft;
  const lines = parsed.sections.flatMap((s) =>
    s.items.map((i) => assessLine(i, sqft, factor)),
  );

  const structuralFindings: string[] = [];
  const itemTotal = parsed.computedTotal - parsed.contingency;
  const contingencyPct = itemTotal > 0 ? (parsed.contingency / itemTotal) * 100 : 0;
  if (contingencyPct < 5) {
    structuralFindings.push(
      `Contingency is ${contingencyPct.toFixed(1)}% — the form itself recommends 10%. Recommend requiring one.`,
    );
  }
  for (const line of lines) {
    if (/[+/&]/.test(line.item) && line.amount >= 10000) {
      structuralFindings.push(
        `"${line.item}" ($${line.amount.toLocaleString()}) bundles multiple trades in one line — hard to verify at draw time. Request an itemized split.`,
      );
    }
  }
  if (
    parsed.totalBudget != null &&
    Math.abs(parsed.totalBudget - parsed.computedTotal) > 1
  ) {
    structuralFindings.push(
      `Stated total ($${parsed.totalBudget.toLocaleString()}) does not match the sum of line items ($${parsed.computedTotal.toLocaleString()}).`,
    );
  }

  return {
    regionFactor: factor,
    lines,
    structuralFindings,
    totals: {
      totalBudget: parsed.totalBudget,
      computedTotal: parsed.computedTotal,
      perSqft: sqft ? Math.round((parsed.totalBudget ?? parsed.computedTotal) / sqft) : null,
      contingency: parsed.contingency,
      contingencyPct: Math.round(contingencyPct * 10) / 10,
    },
  };
}
