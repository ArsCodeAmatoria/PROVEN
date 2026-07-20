export type WeightChartRow = { readonly label: string; readonly value: string; readonly note?: string };

export type WeightChartCategory = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly rows: readonly WeightChartRow[];
};

/** Field reference tables aligned with Module 18 / Appendix B lesson content. */
export const WEIGHT_CHART_CATEGORIES: readonly WeightChartCategory[] = [
  {
    id: "density",
    label: "Material density",
    description:
      "Volume × density for blocks, plates, bulk piles, and irregular solids. Moisture and compaction change bulk materials a lot — weigh a sample when unsure. Verify with manufacturer data when available.",
    rows: [
      { label: "Steel", value: "490 lb/ft³", note: "≈ 7,850 kg/m³" },
      { label: "Cast iron", value: "450 lb/ft³", note: "≈ 7,200 kg/m³" },
      { label: "Aluminum", value: "170 lb/ft³", note: "≈ 2,700 kg/m³" },
      { label: "Brass / bronze", value: "≈ 530 lb/ft³", note: "Alloy dependent" },
      { label: "Copper", value: "560 lb/ft³", note: "≈ 8,960 kg/m³" },
      { label: "Concrete (plain)", value: "150 lb/ft³", note: "≈ 2,400 kg/m³" },
      { label: "Reinforced concrete", value: "160–170 lb/ft³", note: "Use drawings when possible" },
      { label: "Grout / mortar", value: "≈ 140 lb/ft³", note: "Estimate only" },
      { label: "Brick / masonry", value: "≈ 120 lb/ft³", note: "Solid units; hollow lighter" },
      { label: "Asphalt paving", value: "≈ 145 lb/ft³", note: "Compacted" },
      { label: "Wood (dry, varies)", value: "35–60 lb/ft³", note: "Species and moisture matter" },
      { label: "Ice", value: "≈ 57 lb/ft³", note: "Slightly less than water" },
    ],
  },
  {
    id: "bulk-fill",
    label: "Sand, soil & aggregates",
    description:
      "Bulk density for excavated or stockpiled materials. Wet / compacted material is heavier than dry / loose. Use for skip boxes, buckets, and trench spoil estimates.",
    rows: [
      { label: "Sand (dry, loose)", value: "≈ 90–100 lb/ft³", note: "Common teaching ≈ 100 lb/ft³" },
      { label: "Sand (wet / damp)", value: "≈ 110–120 lb/ft³", note: "Common teaching ≈ 120 lb/ft³" },
      { label: "Sand (saturated)", value: "≈ 120–130 lb/ft³", note: "Puddled / submerged" },
      { label: "Gravel (dry, loose)", value: "≈ 95–105 lb/ft³" },
      { label: "Gravel (wet / compacted)", value: "≈ 110–125 lb/ft³" },
      { label: "Crushed stone / rock", value: "≈ 100–110 lb/ft³", note: "Loose pile" },
      { label: "Soil / dirt (dry, loose)", value: "≈ 75–95 lb/ft³" },
      { label: "Soil / dirt (wet)", value: "≈ 100–120 lb/ft³" },
      { label: "Clay (dry)", value: "≈ 80–100 lb/ft³" },
      { label: "Clay (wet)", value: "≈ 100–120 lb/ft³" },
      { label: "Topsoil (loose)", value: "≈ 75–95 lb/ft³" },
      { label: "Snow (fresh / packed)", value: "≈ 5–25 lb/ft³", note: "Highly variable" },
      { label: "Formula", value: "Wt = volume (ft³) × lb/ft³", note: "Add container self-weight" },
    ],
  },
  {
    id: "liquids",
    label: "Water & liquids",
    description:
      "Use for tanks, totes, drums, hydro tests, and wet loads. Add vessel / packaging weight. Densities at roughly 60 °F (15 °C).",
    rows: [
      { label: "Water", value: "62.4 lb/ft³", note: "8.34 lb/US gal · 1,000 kg/m³" },
      { label: "Water (per gallon)", value: "8.34 lb/gal", note: "US gallon" },
      { label: "Water (55-gal drum contents)", value: "≈ 459 lb", note: "Plus drum weight" },
      { label: "Seawater", value: "≈ 64 lb/ft³", note: "≈ 8.6 lb/gal" },
      { label: "Diesel fuel", value: "≈ 52 lb/ft³", note: "≈ 7.0 lb/gal" },
      { label: "Gasoline", value: "≈ 45 lb/ft³", note: "≈ 6.1 lb/gal" },
      { label: "Hydraulic oil", value: "≈ 55 lb/ft³", note: "≈ 7.3 lb/gal; grade varies" },
      { label: "Concrete slurry / wet mix", value: "≈ 140–150 lb/ft³", note: "Before set" },
      { label: "Formula (volume)", value: "Wt = ft³ × 62.4", note: "Fresh water" },
      { label: "Formula (gallons)", value: "Wt = gal × 8.34", note: "Fresh water" },
    ],
  },
  {
    id: "plate",
    label: "Steel plate (per ft²)",
    description: "Flat plate weight ≈ thickness × 40.8 lb/ft² per inch of thickness (carbon steel).",
    rows: [
      { label: "⅛ in plate", value: "5.1 lb/ft²" },
      { label: "¼ in plate", value: "10.2 lb/ft²" },
      { label: "⅜ in plate", value: "15.3 lb/ft²" },
      { label: "½ in plate", value: "20.4 lb/ft²" },
      { label: "⅝ in plate", value: "25.5 lb/ft²" },
      { label: "¾ in plate", value: "30.6 lb/ft²" },
      { label: "1 in plate", value: "40.8 lb/ft²" },
      { label: "1¼ in plate", value: "51.0 lb/ft²" },
      { label: "1½ in plate", value: "61.2 lb/ft²" },
      { label: "2 in plate", value: "81.6 lb/ft²" },
      { label: "Formula", value: "Wt = L × W × t × 40.8", note: "L,W in ft; t in inches" },
    ],
  },
  {
    id: "w-shape",
    label: "Wide-flange beam (lb/ft)",
    description: "Multiply length (ft) × lb/ft from nameplate or handbook. Add connection hardware.",
    rows: [
      { label: "W8×10", value: "10 lb/ft" },
      { label: "W10×12", value: "12 lb/ft" },
      { label: "W12×26", value: "26 lb/ft" },
      { label: "W14×30", value: "30 lb/ft" },
      { label: "W16×36", value: "36 lb/ft" },
      { label: "W18×50", value: "50 lb/ft" },
      { label: "W21×62", value: "62 lb/ft" },
      { label: "W24×84", value: "84 lb/ft" },
      { label: "W27×94", value: "94 lb/ft" },
      { label: "W30×108", value: "108 lb/ft" },
    ],
  },
  {
    id: "dimensional-lumber",
    label: "Dimensional lumber (lb/ft)",
    description:
      "Framing lumber weight per linear foot — dry Douglas fir / SPF teaching estimates. Actual dressed size (e.g. 2×4 = 1.5 in × 3.5 in). Weigh a sample when moisture or species is unknown.",
    rows: [
      { label: "1×4", value: "0.6 lb/ft", note: "Actual 0.75 in × 3.5 in" },
      { label: "1×6", value: "0.9 lb/ft", note: "Actual 0.75 in × 5.5 in" },
      { label: "1×8", value: "1.2 lb/ft", note: "Actual 0.75 in × 7.25 in" },
      { label: "2×4", value: "1.5 lb/ft", note: "Actual 1.5 in × 3.5 in" },
      { label: "2×6", value: "2.0 lb/ft", note: "Actual 1.5 in × 5.5 in" },
      { label: "2×8", value: "2.6 lb/ft", note: "Actual 1.5 in × 7.25 in" },
      { label: "2×10", value: "3.3 lb/ft", note: "Actual 1.5 in × 9.25 in" },
      { label: "2×12", value: "4.7 lb/ft", note: "Actual 1.5 in × 11.25 in" },
      { label: "4×4", value: "2.9 lb/ft", note: "Post / timber" },
      { label: "4×6", value: "4.3 lb/ft" },
      { label: "6×6", value: "6.5 lb/ft" },
      { label: "Formula", value: "Wt = lb/ft × L", note: "L = length in feet; add for bundles" },
    ],
  },
  {
    id: "plywood",
    label: "Plywood (lb/ft² by thickness)",
    description:
      "Panel weight per square foot by nominal thickness. A standard 4×8 sheet = 32 ft² — multiply lb/ft² × 32 for one full sheet. Softwood construction plywood teaching values; species, glue, and moisture change weight.",
    rows: [
      { label: "⅛ in plywood", value: "≈ 0.4 lb/ft²", note: "≈ 13 lb per 4×8 sheet" },
      { label: "¼ in plywood", value: "≈ 0.75 lb/ft²", note: "≈ 24 lb per 4×8 sheet" },
      { label: "⅜ in plywood", value: "≈ 1.1 lb/ft²", note: "≈ 35 lb per 4×8 sheet" },
      { label: "½ in plywood", value: "≈ 1.5 lb/ft²", note: "≈ 48 lb per 4×8 sheet" },
      { label: "⅝ in plywood", value: "≈ 1.9 lb/ft²", note: "≈ 61 lb per 4×8 sheet" },
      { label: "¾ in plywood", value: "≈ 2.3 lb/ft²", note: "≈ 74 lb per 4×8 sheet" },
      { label: "1 in plywood", value: "≈ 3.0 lb/ft²", note: "≈ 96 lb per 4×8 sheet" },
      { label: "1⅛ in plywood", value: "≈ 3.4 lb/ft²", note: "≈ 109 lb per 4×8 sheet" },
      { label: "Formula", value: "Wt = lb/ft² × area (ft²)", note: "4×8 sheet = 32 ft²" },
    ],
  },
  {
    id: "drywall",
    label: "Drywall / gypsum (lb/ft² by thickness)",
    description:
      "Gypsum board weight per square foot by thickness. Standard 4×8 sheet = 32 ft²; 4×12 = 48 ft². Type X / denser boards run heavier — check the label when available.",
    rows: [
      { label: "¼ in drywall", value: "≈ 1.2 lb/ft²", note: "≈ 38 lb per 4×8 sheet" },
      { label: "⅜ in drywall", value: "≈ 1.4 lb/ft²", note: "≈ 45 lb per 4×8 sheet" },
      { label: "½ in drywall", value: "≈ 1.6–1.8 lb/ft²", note: "≈ 51–58 lb per 4×8 sheet" },
      { label: "⅝ in drywall (Type X)", value: "≈ 2.2–2.4 lb/ft²", note: "≈ 70–77 lb per 4×8 sheet" },
      { label: "¾ in drywall", value: "≈ 2.8–3.0 lb/ft²", note: "≈ 90–96 lb per 4×8 sheet" },
      { label: "½ in cement board", value: "≈ 3.0 lb/ft²", note: "≈ 96 lb per 4×8; much heavier than gypsum" },
      { label: "½ in fiber-cement board", value: "≈ 2.5–3.2 lb/ft²", note: "Brand dependent" },
      { label: "Formula", value: "Wt = lb/ft² × area (ft²)", note: "Add pallets / banding for packs" },
    ],
  },
  {
    id: "sheet-goods",
    label: "OSB & other sheet goods (lb/ft²)",
    description:
      "Oriented strand board, MDF, and related panels per square foot. A standard 4×8 sheet = 32 ft². Values vary by grade and moisture.",
    rows: [
      { label: "7/16 in OSB", value: "≈ 1.3 lb/ft²", note: "≈ 42 lb per 4×8 sheet" },
      { label: "15/32 in OSB", value: "≈ 1.5 lb/ft²", note: "≈ 48 lb per 4×8 sheet" },
      { label: "½ in OSB", value: "≈ 1.6 lb/ft²", note: "≈ 51 lb per 4×8 sheet" },
      { label: "19/32 in OSB", value: "≈ 1.8 lb/ft²", note: "≈ 58 lb per 4×8 sheet" },
      { label: "⅝ in OSB", value: "≈ 1.9 lb/ft²", note: "≈ 61 lb per 4×8 sheet" },
      { label: "23/32 in OSB", value: "≈ 2.1 lb/ft²", note: "≈ 67 lb per 4×8 sheet" },
      { label: "¾ in OSB", value: "≈ 2.3 lb/ft²", note: "≈ 74 lb per 4×8 sheet" },
      { label: "½ in MDF", value: "≈ 2.5 lb/ft²", note: "≈ 80 lb per 4×8 sheet" },
      { label: "¾ in MDF", value: "≈ 3.7 lb/ft²", note: "≈ 118 lb per 4×8 sheet" },
      { label: "½ in particleboard", value: "≈ 2.0 lb/ft²", note: "≈ 64 lb per 4×8 sheet" },
      { label: "¾ in particleboard", value: "≈ 3.0 lb/ft²", note: "≈ 96 lb per 4×8 sheet" },
      { label: "Formula", value: "Wt = lb/ft² × area", note: "4×8 sheet area = 32 ft²" },
    ],
  },
  {
    id: "pipe",
    label: "Pipe & round bar (approx.)",
    description: "Use schedule tables or weigh a sample section. These are teaching estimates only.",
    rows: [
      { label: '6" SCH 40 pipe', value: "≈ 18.97 lb/ft" },
      { label: '8" SCH 40 pipe', value: "≈ 28.55 lb/ft" },
      { label: '10" SCH 40 pipe', value: "≈ 40.48 lb/ft" },
      { label: '12" SCH 40 pipe', value: "≈ 49.56 lb/ft" },
      { label: "Round bar (steel)", value: "d² × 2.67 lb/ft", note: "d = diameter in inches" },
    ],
  },
  {
    id: "conversions",
    label: "Unit conversions",
    description: "Check calculator mode (DEG for angles). Confirm force vs mass in your procedure.",
    rows: [
      { label: "1 US ton", value: "2,000 lb" },
      { label: "1 metric tonne", value: "2,204.6 lb" },
      { label: "1 kg", value: "2.205 lb" },
      { label: "1 lb", value: "0.454 kg" },
      { label: "1 ft", value: "0.305 m" },
      { label: "1 m", value: "3.281 ft" },
      { label: "1 ft³", value: "7.48 US gal" },
      { label: "1 US gal", value: "0.134 ft³" },
      { label: "1 yd³", value: "27 ft³", note: "Common for bulk fill" },
      { label: "1 kN (approx.)", value: "224.8 lbf" },
    ],
  },
] as const;

export function getWeightChartCategory(id: string): WeightChartCategory | undefined {
  return WEIGHT_CHART_CATEGORIES.find((c) => c.id === id);
}
