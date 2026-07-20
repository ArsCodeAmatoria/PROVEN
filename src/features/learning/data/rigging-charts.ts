export type RiggingChartRow = {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
};

export type RiggingChartCategory = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly rows: readonly RiggingChartRow[];
};

/**
 * Field reference tables for sling-angle sine math and hitch ratings by sling type.
 * Teaching values aligned with course slides (ASME B30.9 / WSTDA). Always verify the sling tag.
 */
export const RIGGING_CHART_CATEGORIES: readonly RiggingChartCategory[] = [
  {
    id: "sine-angle",
    label: "Sine math — effect of angle",
    description:
      "Angle measured from horizontal. Tension factor (TF) = 1 ÷ sin(θ) = L ÷ H. Reduction factor (RF) = sin(θ) = H ÷ L. Do not use sling angles below 30° from horizontal.",
    rows: [
      { label: "90°", value: "TF 1.000 · RF 1.000", note: "sin 90° = 1.000" },
      { label: "85°", value: "TF 1.004 · RF 0.996", note: "sin 85° ≈ 0.996" },
      { label: "80°", value: "TF 1.015 · RF 0.985", note: "sin 80° ≈ 0.985" },
      { label: "75°", value: "TF 1.035 · RF 0.966", note: "sin 75° ≈ 0.966" },
      { label: "70°", value: "TF 1.064 · RF 0.940", note: "sin 70° ≈ 0.940" },
      { label: "65°", value: "TF 1.104 · RF 0.906", note: "sin 65° ≈ 0.906" },
      { label: "60°", value: "TF 1.155 · RF 0.866", note: "sin 60° ≈ 0.866 — common field target" },
      { label: "55°", value: "TF 1.221 · RF 0.819", note: "sin 55° ≈ 0.819" },
      { label: "50°", value: "TF 1.305 · RF 0.766", note: "sin 50° ≈ 0.766" },
      { label: "45°", value: "TF 1.414 · RF 0.707", note: "sin 45° ≈ 0.707" },
      { label: "40°", value: "TF 1.555 · RF 0.643", note: "sin 40° ≈ 0.643" },
      { label: "35°", value: "TF 1.742 · RF 0.574", note: "sin 35° ≈ 0.574" },
      { label: "30°", value: "TF 2.000 · RF 0.500", note: "sin 30° = 0.500 — minimum recommended" },
      {
        label: "Formulas",
        value: "TF = 1 ÷ sin(θ) = L ÷ H · RF = sin(θ) = H ÷ L",
        note: "Calculator in DEG mode",
      },
    ],
  },
  {
    id: "two-leg-tension",
    label: "Two-leg bridle tension",
    description:
      "Symmetric two-leg vertical hitch — each leg shares half the load vertically, then angle multiplies tension. T = W ÷ (2 × sin θ) = (W ÷ 2) × TF.",
    rows: [
      { label: "90°", value: "T = 0.50 × W", note: "Each leg carries half the load" },
      { label: "75°", value: "T ≈ 0.52 × W", note: "× 1.035 on each half-share" },
      { label: "60°", value: "T ≈ 0.58 × W", note: "× 1.155" },
      { label: "45°", value: "T ≈ 0.71 × W", note: "× 1.414" },
      { label: "30°", value: "T = 1.00 × W", note: "Each leg carries the full load weight" },
      {
        label: "Example (W = 8,000 lb @ 60°)",
        value: "T = 8,000 ÷ (2 × 0.866) ≈ 4,619 lb per leg",
        note: "Or (4,000) × 1.155",
      },
      {
        label: "Formula",
        value: "T = W ÷ (2 sin θ)",
        note: "Equal legs, centered COG, θ from horizontal",
      },
    ],
  },
  {
    id: "hitch-synthetic",
    label: "Hitch ratings — synthetic web & roundsling",
    description:
      "Percent of vertical hitch WLL when the tag does not list a separate rating. Always use the manufacturer’s tag when it shows hitch capacities.",
    rows: [
      { label: "Vertical hitch", value: "100%", note: "Baseline WLL on the tag" },
      {
        label: "Choker — synthetic web",
        value: "75% of vertical",
        note: "WSTDA WS-1 teaching default if tag omits choker",
      },
      {
        label: "Choker — polyester roundsling",
        value: "80% of vertical",
        note: "WSTDA RS-1 teaching default if tag omits choker",
      },
      {
        label: "Basket (legs vertical, balanced)",
        value: "200% of vertical",
        note: "Both legs plumb — not for inclined basket legs",
      },
      {
        label: "Double-leg choker — web",
        value: "150% of vertical",
        note: "2 × single web choker (75%)",
      },
      {
        label: "Double-leg choker — roundsling",
        value: "160% of vertical",
        note: "2 × single roundsling choker (80%)",
      },
      {
        label: "Double wrap hitch",
        value: "Use manufacturer WLL",
        note: "Improves grip — does not raise capacity unless tagged",
      },
    ],
  },
  {
    id: "hitch-wire-chain",
    label: "Hitch ratings — wire rope & chain",
    description:
      "Typical catalog relationships to vertical hitch rating. Wire rope and alloy chain tags list hitch columns — read the tag for the size and grade in use.",
    rows: [
      { label: "Vertical hitch", value: "100%", note: "Single vertical leg" },
      {
        label: "Choker hitch",
        value: "Typically ≈ 75% of vertical",
        note: "Use tag value; choke angle may reduce further",
      },
      {
        label: "Basket hitch (vertical legs)",
        value: "Typically 200% of vertical",
        note: "Balanced load; both sides supporting",
      },
      {
        label: "2-leg bridle @ 60°",
        value: "See tag angle column",
        note: "Often the published reference angle on wire/chain charts",
      },
      {
        label: "2-leg bridle @ 45° / 30°",
        value: "Lower capacity than 60°",
        note: "Shallower angle → less rated capacity per leg",
      },
      {
        label: "3- & 4-leg bridles",
        value: "Do not assume equal share",
        note: "Calculate with applicable angle; often rate as 3-leg for 4-leg picks",
      },
    ],
  },
  {
    id: "choke-angle",
    label: "Choke angle reduction (ASME B30.9)",
    description:
      "Angle of choke is measured at the choke point — not the sling-to-horizontal leg angle. Apply these factors to the choker hitch rating when the choke is tighter than 120°.",
    rows: [
      { label: "120°–180°", value: "100% of choker rating", note: "Full choker WLL" },
      { label: "90°–119°", value: "87% of choker rating" },
      { label: "60°–89°", value: "74% of choker rating" },
      { label: "30°–59°", value: "62% of choker rating" },
      { label: "0°–29°", value: "49% of choker rating", note: "Avoid when possible" },
      {
        label: "Combined check",
        value: "Choker % × choke-angle % × angle RF (if legs inclined)",
        note: "Follow manufacturer instructions when they differ",
      },
    ],
  },
  {
    id: "basket-inclined",
    label: "Basket hitch — inclined legs",
    description:
      "Vertical basket legs may use up to 200% of vertical WLL. Inclined basket legs must be derated with sine math — do not keep the full 200%.",
    rows: [
      {
        label: "Vertical basket legs",
        value: "Up to 200% of vertical WLL",
        note: "Legs plumb, load balanced",
      },
      {
        label: "Inclined basket capacity",
        value: "Basket WLL × sin(θ)  or  Basket WLL ÷ (L ÷ H)",
        note: "θ from horizontal; same RF as angle chart",
      },
      {
        label: "Example (Basket WLL 20,000 lb @ 60°)",
        value: "20,000 × 0.866 ≈ 17,320 lb",
        note: "Or 20,000 ÷ 1.155",
      },
      {
        label: "Field practice",
        value: "Keep basket legs as vertical as practical",
        note: "Use a spreader or longer reach if the angle goes shallow",
      },
    ],
  },
  {
    id: "how-to-use",
    label: "How to use these charts",
    description:
      "Two common methods — pick one and stay consistent. Always confirm DEG mode on the calculator and the hitch type on the sling tag.",
    rows: [
      {
        label: "Increased tension (select sling)",
        value: "Min rating needed = (share of load) × TF",
        note: "TF from angle chart or L ÷ H",
      },
      {
        label: "Reduced capacity (known sling)",
        value: "Allowed load = hitch WLL × RF",
        note: "RF from angle chart or H ÷ L",
      },
      {
        label: "Measure L and H",
        value: "L = sling length · H = vertical height to hook",
        note: "From a common horizontal plane at the load connection",
      },
      {
        label: "Below 30°",
        value: "Not recommended",
        note: "Extreme tension and horizontal forces",
      },
      {
        label: "Tag first",
        value: "Manufacturer WLL overrides teaching defaults",
        note: "Missing/illegible tag → remove from service",
      },
    ],
  },
] as const;

export function getRiggingChartCategory(id: string): RiggingChartCategory | undefined {
  return RIGGING_CHART_CATEGORIES.find((c) => c.id === id);
}
