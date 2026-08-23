import * as XLSX from "xlsx";

// Parser for FlipCo Financial's "Budget & Specifications" rehab workbook.
// The form has a fixed layout, so this walks known landmarks instead of
// guessing: project facts at the top, a work narrative, then categorized
// line-item sections each ending in a subtotal, then the project total.

export interface SowLineItem {
  section: string;
  item: string;
  details: string;
  amount: number;
}

export interface SowSection {
  name: string;
  items: SowLineItem[];
  /** Template rows left blank — useful for scope crosschecks. */
  unpriced: string[];
  subtotal: number | null;
}

export interface ParsedSow {
  project: {
    address: string;
    city: string | null;
    state: string | null;
    zip: string | null;
    sqft: number | null;
    beds: number | null;
    baths: number | null;
    months: number | null;
  };
  narrative: string;
  sections: SowSection[];
  contingency: number;
  totalBudget: number | null;
  /** Sum of parsed line items + contingency, to cross-check totalBudget. */
  computedTotal: number;
}

const SECTION_NAMES = [
  "Soft Costs",
  "Demo, Foundation",
  "HVAC, Plumbing, Electrical",
  "Interior",
  "Exterior",
];

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,\s]/g, ""));
    if (Number.isFinite(n) && v.trim() !== "") return n;
  }
  return null;
}

function asText(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

export function parseRehabWorkbook(bytes: Uint8Array): ParsedSow {
  const wb = XLSX.read(bytes, { type: "array" });
  const sheetName =
    wb.SheetNames.find((n) => /budget/i.test(n)) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Workbook has no readable sheet.");
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  const findRowByLabel = (label: string): unknown[] | undefined =>
    rows.find((r) => asText(r?.[0]).toLowerCase() === label.toLowerCase());

  const address = asText(findRowByLabel("Project Address")?.[1]);
  // City is best-effort (the token before the state); state + zip drive pricing.
  const locMatch = address.match(/([A-Za-z\-]+)[,\s]+([A-Z]{2})[,\s]+(\d{5})/);

  const project = {
    address,
    city: locMatch ? locMatch[1].trim().replace(/[.,]+$/, "") : null,
    state: locMatch ? locMatch[2] : null,
    zip: locMatch ? locMatch[3] : null,
    sqft: asNumber(findRowByLabel("Property Square Footage")?.[1]),
    beds: asNumber(findRowByLabel("# of Bedrooms")?.[1]),
    baths: asNumber(findRowByLabel("# of Bathrooms")?.[1]),
    months: asNumber(findRowByLabel("Time to Complete (Months)")?.[1]),
  };

  // The narrative is the first long text row after the "Description of Work" label.
  let narrative = "";
  const descIdx = rows.findIndex(
    (r) => asText(r?.[0]).toLowerCase() === "description of work",
  );
  if (descIdx >= 0) {
    for (let i = descIdx + 1; i < Math.min(descIdx + 6, rows.length); i++) {
      const t = asText(rows[i]?.[0]);
      // Skip the form's own instruction line ("Please provide a general...").
      if (t.length > 80 && !/^please\b/i.test(t)) {
        narrative = t;
        break;
      }
    }
  }

  const sections: SowSection[] = [];
  let current: SowSection | null = null;
  let contingency = 0;
  let totalBudget: number | null = null;

  for (const row of rows) {
    const a = asText(row?.[0]);
    const b = asText(row?.[1]);
    const c = asNumber(row?.[2]);

    if (b === "Total Project Budget") {
      totalBudget = c;
      continue;
    }
    const sectionMatch = SECTION_NAMES.find((s) => a === s);
    if (sectionMatch) {
      current = { name: sectionMatch, items: [], unpriced: [], subtotal: null };
      sections.push(current);
      continue;
    }
    if (!current) continue;
    if (a === "Item") continue; // column header row
    if (/^contingency/i.test(a)) {
      contingency = c ?? 0;
      continue;
    }
    if (a === "" && c != null) {
      // Subtotal rows carry only a value in the Total column.
      current.subtotal = c;
      continue;
    }
    if (a !== "" && c != null) {
      current.items.push({ section: current.name, item: a, details: b, amount: c });
    } else if (a !== "" && a !== "Other") {
      current.unpriced.push(a);
    }
  }

  const computedTotal =
    sections.reduce(
      (sum, s) => sum + s.items.reduce((t, i) => t + i.amount, 0),
      0,
    ) + contingency;

  return { project, narrative, sections, contingency, totalBudget, computedTotal };
}
