import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RiggingDiagramId =
  | "sling-bridle-90"
  | "sling-bridle-60"
  | "sling-bridle-45"
  | "sling-bridle-30"
  | "sling-bridle-intro"
  | "bridle-math-lh"
  | "force-triangle"
  | "leg-included-angle"
  | "tension-multiplier-chart"
  | "horizontal-compression"
  | "bucket-compression"
  | "sling-angle-slopes"
  | "sling-tension-sine"
  | "cog-centered"
  | "cog-offset"
  | "cog-complex"
  | "three-leg-bridle"
  | "load-moment"
  | "volume-block"
  | "choker-hitch"
  | "basket-hitch"
  | "vertical-hitch"
  | "basket-vertical-vs-inclined"
  | "opposing-chokes"
  | "edge-protection"
  | "design-factor"
  | "sling-design-factors"
  | "weakest-link"
  | "land-before-detach"
  | "spreader-bar"
  | "wire-rope-broken"
  | "hook-throat"
  | "lift-exclusion"
  | "plate-dimensions"
  | "canada-rigging-stats";

const LABEL = "fill-foreground text-[11px] font-medium";
const DIM = "stroke-foreground/50 stroke-[1.25]";
const MAIN = "stroke-foreground stroke-[2.25]";
const ACCENT = "stroke-foreground/70 stroke-[1.75]";

function DiagramFrame({
  children,
  className,
  viewBox = "0 0 400 300",
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-hidden
      className={cn("mx-auto w-full max-w-md text-foreground", className)}
    >
      {children}
    </svg>
  );
}

function BridleMathLhDiagram() {
  const cx = 200;
  const hookY = 48;
  const loadY = 230;
  const angleDeg = 45;
  const rise = loadY - hookY;
  const rad = (angleDeg * Math.PI) / 180;
  const halfSpan = rise / Math.tan(rad);
  const leftX = cx - halfSpan;
  const rightX = cx + halfSpan;
  const midLX = (cx + leftX) / 2;
  const midLY = (hookY + loadY) / 2;

  return (
    <DiagramFrame viewBox="0 0 400 300" className="max-w-none">
      {/* Vertical height H */}
      <line x1={cx} y1={hookY} x2={cx} y2={loadY} className="stroke-foreground/35 stroke-[1.5] stroke-dasharray-[5_4]" />
      <text x={cx + 10} y={(hookY + loadY) / 2} className={LABEL}>
        H
      </text>
      {/* Legs */}
      <line x1={leftX} y1={loadY} x2={cx} y2={hookY} className={MAIN} />
      <line x1={rightX} y1={loadY} x2={cx} y2={hookY} className={MAIN} />
      {/* Hook */}
      <circle cx={cx} cy={hookY} r={8} className={MAIN} fill="none" />
      {/* Load */}
      <rect
        x={leftX - 16}
        y={loadY}
        width={rightX - leftX + 32}
        height={20}
        className={MAIN}
        fill="hsl(var(--foreground) / 0.08)"
      />
      <text x={cx} y={loadY + 42} textAnchor="middle" className={LABEL}>
        Load W
      </text>
      {/* L along left leg */}
      <text x={midLX - 18} y={midLY - 6} className={LABEL}>
        L
      </text>
      {/* Angle θ */}
      <path
        d={`M ${leftX + 42} ${loadY} A 42 42 0 0 0 ${leftX + 42 * Math.cos(rad)} ${loadY - 42 * Math.sin(rad)}`}
        className={ACCENT}
        fill="none"
      />
      <text x={leftX + 54} y={loadY - 16} className={LABEL}>
        θ
      </text>
      {/* Horizontal */}
      <line x1={leftX - 28} y1={loadY} x2={rightX + 28} y2={loadY} className={DIM} />
      <text x={cx} y={28} textAnchor="middle" className={LABEL}>
        L ÷ H = tension multiplier
      </text>
    </DiagramFrame>
  );
}

function SlingBridle({
  angleDeg,
  multiplier,
  loadWeight,
}: {
  readonly angleDeg: number;
  readonly multiplier?: string;
  readonly loadWeight?: string;
}) {
  const cx = 200;
  const hookY = 42;
  const loadY = 248;
  const rise = loadY - hookY;
  const rad = (angleDeg * Math.PI) / 180;
  const halfSpan = angleDeg >= 89 ? 28 : rise / Math.tan(rad);
  const leftX = cx - halfSpan;
  const rightX = cx + halfSpan;
  const arcR = 36;

  return (
    <DiagramFrame>
      <line x1={leftX} y1={loadY} x2={cx} y2={hookY} className={MAIN} />
      <line x1={rightX} y1={loadY} x2={cx} y2={hookY} className={MAIN} />
      <circle cx={cx} cy={hookY} r={7} className={MAIN} fill="none" />
      <text x={cx} y={hookY - 14} textAnchor="middle" className={LABEL}>
        Hook
      </text>
      <rect x={leftX - 18} y={loadY} width={rightX - leftX + 36} height={18} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <text x={cx} y={loadY + 38} textAnchor="middle" className={LABEL}>
        {loadWeight ? `Load W = ${loadWeight}` : "Load W"}
      </text>
      <path
        d={`M ${leftX + arcR} ${loadY} A ${arcR} ${arcR} 0 0 0 ${leftX + arcR * Math.cos(rad)} ${loadY - arcR * Math.sin(rad)}`}
        className={ACCENT}
        fill="none"
      />
      <text x={leftX + 52} y={loadY - 14} className={LABEL}>
        θ = {angleDeg}°
      </text>
      <text x={leftX - 8} y={loadY - 30} className={LABEL}>
        T
      </text>
      <text x={rightX + 4} y={loadY - 30} className={LABEL}>
        T
      </text>
      {multiplier ? (
        <text x={cx} y={loadY + 58} textAnchor="middle" className={LABEL}>
          Multiplier × {multiplier}
        </text>
      ) : null}
      <line x1={leftX - 40} y1={loadY} x2={rightX + 40} y2={loadY} className={DIM} />
      <text x={rightX + 44} y={loadY + 4} className={LABEL}>
        horizontal
      </text>
    </DiagramFrame>
  );
}

function ForceTriangle() {
  return (
    <DiagramFrame>
      <line x1={120} y1={240} x2={120} y2={60} className={MAIN} />
      <text x={98} y={150} className={LABEL}>
        W
      </text>
      <line x1={120} y1={240} x2={300} y2={80} className={MAIN} />
      <text x={220} y={140} className={LABEL}>
        T (sling)
      </text>
      <line x1={120} y1={240} x2={300} y2={240} className={ACCENT} />
      <text x={200} y={258} textAnchor="middle" className={LABEL}>
        horizontal component
      </text>
      <path d="M 120 220 L 140 220 L 140 240 Z" className={DIM} fill="hsl(var(--foreground) / 0.15)" />
      <text x={200} y={36} textAnchor="middle" className={LABEL}>
        T = W ÷ (2 sin θ) per leg — force triangle at one leg
      </text>
    </DiagramFrame>
  );
}

function LegIncludedAngle() {
  return (
    <DiagramFrame viewBox="0 0 400 320">
      <text x={200} y={28} textAnchor="middle" className={LABEL}>
        Leg angle θ from horizontal ≠ included angle between legs
      </text>
      <line x1={100} y1={200} x2={200} y2={70} className={MAIN} />
      <line x1={300} y1={200} x2={200} y2={70} className={MAIN} />
      <circle cx={200} cy={70} r={6} className={MAIN} fill="none" />
      <rect x={80} y={200} width={240} height={16} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <path d="M 130 200 A 40 40 0 0 0 155 168" className={ACCENT} fill="none" />
      <text x={118} y={188} className={LABEL}>
        θ = 30°
      </text>
      <path d="M 170 78 A 30 30 0 0 1 230 78" className={ACCENT} fill="none" />
      <text x={200} y={58} textAnchor="middle" className={LABEL}>
        included = 60°
      </text>
      <text x={200} y={248} textAnchor="middle" className={LABEL}>
        Symmetric bridle: included angle ≈ 2θ (same convention)
      </text>
    </DiagramFrame>
  );
}

function TensionMultiplierChart() {
  const bars = [
    { label: "90°", mult: "1.00", h: 40 },
    { label: "75°", mult: "1.04", h: 42 },
    { label: "60°", mult: "1.15", h: 46 },
    { label: "45°", mult: "1.41", h: 57 },
    { label: "30°", mult: "2.00", h: 80 },
  ];
  const baseY = 220;
  const startX = 56;
  const gap = 62;

  return (
    <DiagramFrame viewBox="0 0 400 280" className="max-w-none">
      <text x={200} y={28} textAnchor="middle" className={LABEL}>
        Tension multiplier vs sling angle
      </text>
      <line x1={40} y1={baseY} x2={360} y2={baseY} className={DIM} />
      <line x1={40} y1={50} x2={40} y2={baseY} className={DIM} />
      {bars.map((bar, i) => {
        const x = startX + i * gap;
        return (
          <g key={bar.label}>
            <rect
              x={x}
              y={baseY - bar.h}
              width={40}
              height={bar.h}
              className={MAIN}
              fill="hsl(var(--foreground) / 0.12)"
            />
            <text x={x + 20} y={baseY - bar.h - 8} textAnchor="middle" className={LABEL}>
              ×{bar.mult}
            </text>
            <text x={x + 20} y={baseY + 20} textAnchor="middle" className={LABEL}>
              {bar.label}
            </text>
          </g>
        );
      })}
      <text x={200} y={262} textAnchor="middle" className={LABEL}>
        θ measured from horizontal
      </text>
    </DiagramFrame>
  );
}

function HorizontalCompression() {
  return (
    <DiagramFrame>
      <line x1={130} y1={60} x2={200} y2={60} className={MAIN} />
      <line x1={270} y1={60} x2={200} y2={60} className={MAIN} />
      <line x1={130} y1={220} x2={200} y2={60} className={MAIN} />
      <line x1={270} y1={220} x2={200} y2={60} className={MAIN} />
      <rect x={100} y={220} width={200} height={24} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <line x1={70} y1={232} x2={100} y2={232} className={ACCENT} markerStart="url(#arrow)" />
      <line x1={330} y1={232} x2={300} y2={232} className={ACCENT} />
      <text x={52} y={236} className={LABEL}>
        ←
      </text>
      <text x={336} y={236} className={LABEL}>
        →
      </text>
      <text x={200} y={268} textAnchor="middle" className={LABEL}>
        Low angle → inward compression on load
      </text>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
        </marker>
      </defs>
    </DiagramFrame>
  );
}

function BucketCompression() {
  const apex = { x: 200, y: 62 };
  const left = { x: 108, y: 218 };
  const right = { x: 292, y: 218 };
  const boldMain = "stroke-foreground stroke-[4]";
  const boldLabel = "fill-foreground text-[15px] font-bold";

  return (
    <DiagramFrame className="max-w-none" viewBox="0 0 400 252">
      <circle cx={apex.x} cy={apex.y} r={18} className="fill-foreground" />
      <text x={apex.x} y={28} textAnchor="middle" className={cn(boldLabel, "text-[18px]")}>
        Hook
      </text>

      <line x1={apex.x} y1={apex.y + 18} x2={left.x} y2={left.y - 14} className={boldMain} />
      <line x1={apex.x} y1={apex.y + 18} x2={right.x} y2={right.y - 14} className={boldMain} />
      <text x={142} y={124} className={cn(boldLabel, "text-[18px]")}>
        T
      </text>
      <text x={248} y={124} className={cn(boldLabel, "text-[18px]")}>
        T
      </text>

      <path d="M 84 222 L 120 222 L 114 252 L 78 252 Z" className="fill-foreground/20" />
      <path d="M 280 222 L 316 222 L 322 252 L 286 252 Z" className="fill-foreground/20" />
    </DiagramFrame>
  );
}

function BridleAnglePanel({
  panelX,
  panelWidth,
  angleDeg,
  title,
  noteLines,
  panelTopY,
  large = false,
}: {
  readonly panelX: number;
  readonly panelWidth: number;
  readonly angleDeg: number;
  readonly title: string;
  readonly noteLines: readonly string[];
  readonly panelTopY: number;
  readonly large?: boolean;
}) {
  const lineHeight = large ? 12 : 11;
  const notePad = large ? 10 : 8;
  const noteAreaHeight = notePad + noteLines.length * lineHeight;
  const titleArea = large ? 26 : 22;
  const panelHeight = large ? 132 + noteAreaHeight : 118 + noteAreaHeight;
  const cx = panelX + panelWidth / 2;
  const loadY = panelTopY + panelHeight - noteAreaHeight - 6;
  const maxHalf = panelWidth / 2 - (large ? 18 : 20);
  const maxRise = loadY - (panelTopY + titleArea) - (large ? 12 : 10);
  const targetRise = Math.min(large ? 68 : 58, Math.max(36, maxRise));
  const rad = (angleDeg * Math.PI) / 180;
  let halfSpan = targetRise / Math.tan(rad);
  let rise = targetRise;
  if (halfSpan > maxHalf) {
    halfSpan = maxHalf;
    rise = halfSpan * Math.tan(rad);
  }
  const hookY = loadY - rise;
  const leftX = cx - halfSpan;
  const rightX = cx + halfSpan;
  const hookR = large ? 7 : 6;
  const legMain = large ? "stroke-foreground stroke-[4]" : "stroke-foreground stroke-[3.5]";
  const titleLabel = large ? "fill-foreground text-[13px] font-bold" : "fill-foreground text-[12px] font-bold";
  const noteLabel = large ? "fill-foreground/85 text-[10px] font-medium" : "fill-foreground/80 text-[9px] font-medium";
  const arcR = large ? 18 : 16;

  return (
    <g>
      <rect
        x={panelX + 3}
        y={panelTopY}
        width={panelWidth - 6}
        height={panelHeight}
        rx={2}
        className="fill-foreground/[0.06] stroke-foreground/15 stroke-[1]"
      />
      <text x={cx} y={panelTopY + (large ? 18 : 16)} textAnchor="middle" className={titleLabel}>
        {title}
      </text>
      <circle cx={cx} cy={hookY} r={hookR} className="fill-foreground" />
      <line x1={leftX} y1={loadY} x2={cx} y2={hookY + hookR} className={legMain} />
      <line x1={rightX} y1={loadY} x2={cx} y2={hookY + hookR} className={legMain} />
      <line x1={leftX - 4} y1={loadY} x2={rightX + 4} y2={loadY} className={DIM} />
      <rect x={leftX - 2} y={loadY} width={rightX - leftX + 4} height={large ? 7 : 6} className="fill-foreground/15" />
      <line x1={leftX} y1={loadY} x2={leftX + arcR * 2} y2={loadY} className={ACCENT} />
      <path
        d={`M ${leftX + arcR} ${loadY} A ${arcR} ${arcR} 0 0 0 ${leftX + arcR * Math.cos(rad)} ${loadY - arcR * Math.sin(rad)}`}
        className={ACCENT}
        fill="none"
      />
      <text x={leftX + arcR + 5} y={loadY - 7} className={titleLabel}>
        θ
      </text>
      {noteLines.map((line, index) => (
        <text
          key={line}
          x={cx}
          y={panelTopY + panelHeight - notePad - (noteLines.length - 1 - index) * lineHeight}
          textAnchor="middle"
          className={noteLabel}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function SlingAngleSlopes() {
  const titleLabel = "fill-foreground text-[14px] font-bold";
  const triStroke = "stroke-foreground stroke-[3] fill-foreground/[0.08]";
  const noteLabel = "fill-foreground/85 text-[11px] font-medium";
  const topY = 8;
  const topH = 152;
  const bottomY = topY + topH + 10;
  const cx = 240;
  const apexY = 54;
  const baseY = 132;
  const halfBase = 68;

  return (
    <DiagramFrame className="max-w-none" viewBox="0 0 480 388">
      <rect x={8} y={topY} width={464} height={topH} rx={3} className="fill-foreground/[0.04] stroke-foreground/12 stroke-[1]" />
      <text x={cx} y={topY + 22} textAnchor="middle" className={titleLabel}>
        60° — equilateral triangle
      </text>

      <polygon
        points={`${cx},${apexY} ${cx - halfBase},${baseY} ${cx + halfBase},${baseY}`}
        className={triStroke}
      />
      <text x={cx - halfBase - 8} y={98} textAnchor="end" className={titleLabel}>
        60°
      </text>
      <text x={cx} y={topY + topH - 12} textAnchor="middle" className={noteLabel}>
        T × 1.155 · effective capacity 86.6%
      </text>

      <BridleAnglePanel
        panelX={8}
        panelWidth={228}
        angleDeg={45}
        title="45°"
        noteLines={["Perfect slope · rise = run", "T × 1.414 · capacity 70.7%"]}
        panelTopY={bottomY}
        large
      />
      <BridleAnglePanel
        panelX={244}
        panelWidth={228}
        angleDeg={30}
        title="30°"
        noteLines={["Leg ≈ 2× lift height", "T × 2.0 · capacity 50%"]}
        panelTopY={bottomY}
        large
      />
      <text x={cx} y={378} textAnchor="middle" className={noteLabel}>
        1 ÷ tension multiplier = effective capacity (sin θ)
      </text>
    </DiagramFrame>
  );
}

function SlingTensionSine() {
  const panelStroke = "fill-foreground/[0.04] stroke-foreground/12 stroke-[1]";
  const titleLabel = "fill-foreground text-[14px] font-bold";
  const noteLabel = "fill-foreground/85 text-[11px] font-medium";
  const highlightLabel = "fill-foreground text-[12px] font-bold";
  const legMain = "stroke-foreground stroke-[3.5]";

  const pad = 16;
  const width = 480 - pad * 2;
  const bridleTop = 10;
  const bridleH = 152;
  const gap = 14;
  const tableTop = bridleTop + bridleH + gap;
  const tableH = 154;

  const cx = 240;
  const hookY = 52;
  const loadY = 118;
  const halfSpan = 56;
  const leftX = cx - halfSpan;
  const rightX = cx + halfSpan;

  const angleRows = [
    { angle: "90°", pull: "Easy", load: "10 of 10", highlight: false },
    { angle: "60°", pull: "Harder", load: "~9 of 10", highlight: false },
    { angle: "45°", pull: "Harder", load: "~7 of 10", highlight: true },
    { angle: "30°", pull: "2× hard", load: "5 of 10", highlight: false },
  ];

  return (
    <DiagramFrame className="max-w-none" viewBox={`0 0 480 ${tableTop + tableH + 10}`}>
      {/* 45° bridle */}
      <rect x={pad} y={bridleTop} width={width} height={bridleH} rx={3} className={panelStroke} />
      <text x={cx} y={bridleTop + 22} textAnchor="middle" className={titleLabel}>
        45° bridle — both legs
      </text>

      <circle cx={cx} cy={hookY} r={7} className="fill-foreground" />
      <line x1={leftX} y1={loadY} x2={cx} y2={hookY + 7} className={legMain} />
      <line x1={rightX} y1={loadY} x2={cx} y2={hookY + 7} className={legMain} />
      <rect x={leftX - 4} y={loadY} width={rightX - leftX + 8} height={8} className="fill-foreground/15" />

      <text x={cx} y={bridleTop + bridleH - 28} textAnchor="middle" className={noteLabel}>
        Each leg pulls harder
      </text>
      <text x={cx} y={bridleTop + bridleH - 12} textAnchor="middle" className={highlightLabel}>
        Safe load ≈ 7 of 10
      </text>

      {/* lookup table */}
      <rect x={pad} y={tableTop} width={width} height={tableH} rx={3} className={panelStroke} />
      <text x={cx} y={tableTop + 22} textAnchor="middle" className={titleLabel}>
        Angle · pull · safe load
      </text>
      <line
        x1={pad + 10}
        y1={tableTop + 30}
        x2={pad + width - 10}
        y2={tableTop + 30}
        className="stroke-foreground/12 stroke-1"
      />

      <text x={pad + 20} y={tableTop + 46} className={noteLabel}>
        Angle
      </text>
      <text x={cx} y={tableTop + 46} textAnchor="middle" className={noteLabel}>
        Pull
      </text>
      <text x={pad + width - 20} y={tableTop + 46} textAnchor="end" className={noteLabel}>
        Safe load
      </text>

      {angleRows.map((row, index) => {
        const rowY = tableTop + 62 + index * 24;
        return (
          <g key={row.angle}>
            {row.highlight ? (
              <rect
                x={pad + 10}
                y={rowY - 12}
                width={width - 20}
                height={22}
                rx={2}
                className="fill-foreground/[0.12]"
              />
            ) : null}
            <text x={pad + 20} y={rowY} className={row.highlight ? highlightLabel : noteLabel}>
              {row.angle}
            </text>
            <text x={cx} y={rowY} textAnchor="middle" className={row.highlight ? highlightLabel : noteLabel}>
              {row.pull}
            </text>
            <text x={pad + width - 20} y={rowY} textAnchor="end" className={row.highlight ? highlightLabel : noteLabel}>
              {row.load}
            </text>
          </g>
        );
      })}

      <text x={cx} y={tableTop + tableH - 10} textAnchor="middle" className={noteLabel}>
        Steeper = easier · flatter = harder
      </text>
    </DiagramFrame>
  );
}

function CogCentered() {
  return (
    <DiagramFrame>
      <line x1={200} y1={50} x2={200} y2={120} className={MAIN} />
      <circle cx={200} cy={42} r={8} className={MAIN} fill="none" />
      <rect x={120} y={200} width={160} height={48} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <circle cx={200} cy={224} r={6} className={ACCENT} fill="hsl(var(--foreground) / 0.25)" />
      <line x1={200} y1={120} x2={200} y2={200} className={DIM} strokeDasharray="4 4" />
      <text x={212} y={180} className={LABEL}>
        hook above COG
      </text>
      <text x={200} y={268} textAnchor="middle" className={LABEL}>
        Center of gravity — load hangs level
      </text>
    </DiagramFrame>
  );
}

function CogOffset() {
  return (
    <DiagramFrame>
      <line x1={240} y1={50} x2={240} y2={110} className={MAIN} />
      <circle cx={240} cy={42} r={8} className={MAIN} fill="none" />
      <line x1={130} y1={200} x2={240} y2={110} className={MAIN} />
      <line x1={290} y1={200} x2={240} y2={110} className={ACCENT} />
      <rect x={100} y={200} width={220} height={48} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <circle cx={175} cy={224} r={6} className={ACCENT} fill="hsl(var(--foreground) / 0.25)" />
      <text x={160} y={268} className={LABEL}>
        COG
      </text>
      <text x={200} y={36} textAnchor="middle" className={LABEL}>
        Shorten heavy side — hook may need to be over COG
      </text>
    </DiagramFrame>
  );
}

function CogComplex() {
  return (
    <DiagramFrame viewBox="0 0 400 300">
      <rect x={90} y={180} width={220} height={20} className={MAIN} fill="hsl(var(--foreground) / 0.06)" />
      <rect x={110} y={120} width={80} height={60} className={MAIN} fill="hsl(var(--foreground) / 0.1)" />
      <rect x={220} y={140} width={70} height={40} className={MAIN} fill="hsl(var(--foreground) / 0.14)" />
      <circle cx={185} cy={200} r={7} className={ACCENT} fill="hsl(var(--foreground) / 0.3)" />
      <line x1={185} y1={50} x2={185} y2={90} className={MAIN} />
      <text x={185} y={268} textAnchor="middle" className={LABEL}>
        COG from drawing or trial hoist — not always geometric center
      </text>
    </DiagramFrame>
  );
}

function ThreeLegBridle() {
  return (
    <DiagramFrame>
      <circle cx={200} cy={48} r={7} className={MAIN} fill="none" />
      <line x1={120} y1={220} x2={200} y2={48} className={MAIN} />
      <line x1={280} y1={220} x2={200} y2={48} className={MAIN} />
      <line x1={200} y1={220} x2={200} y2={48} className={ACCENT} />
      <rect x={90} y={220} width={220} height={20} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <text x={200} y={262} textAnchor="middle" className={LABEL}>
        One leg may slack — do not assume equal share
      </text>
    </DiagramFrame>
  );
}

function LoadMoment() {
  return (
    <DiagramFrame viewBox="0 0 400 280">
      <line x1={60} y1={220} x2={60} y2={80} className={MAIN} />
      <line x1={60} y1={220} x2={280} y2={120} className={MAIN} />
      <rect x={270} y={200} width={50} height={30} className={MAIN} fill="hsl(var(--foreground) / 0.1)" />
      <line x1={60} y1={220} x2={295} y2={220} className={ACCENT} />
      <text x={175} y={238} textAnchor="middle" className={LABEL}>
        d (radius)
      </text>
      <text x={295} y={192} className={LABEL}>
        F
      </text>
      <text x={200} y={36} textAnchor="middle" className={LABEL}>
        M = F × d — farther radius reduces crane capacity
      </text>
    </DiagramFrame>
  );
}

function VolumeBlock() {
  return (
    <DiagramFrame viewBox="0 0 400 260">
      <rect x={120} y={80} width={160} height={100} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <line x1={120} y1={80} x2={150} y2={50} className={DIM} />
      <line x1={280} y1={80} x2={310} y2={50} className={DIM} />
      <line x1={150} y1={50} x2={310} y2={50} className={DIM} />
      <line x1={280} y1={180} x2={310} y2={150} className={DIM} />
      <line x1={310} y1={50} x2={310} y2={150} className={DIM} />
      <text x={200} y={135} textAnchor="middle" className={LABEL}>
        Volume × ρ = W
      </text>
      <text x={200} y={220} textAnchor="middle" className={LABEL}>
        L × W × t (plate) or ft³ × lb/ft³
      </text>
    </DiagramFrame>
  );
}

function ChokerHitch() {
  return (
    <DiagramFrame>
      <circle cx={200} cy={40} r={7} className={MAIN} fill="none" />
      <path d="M 200 47 Q 120 120 140 220 L 260 220 Q 280 120 200 47" className={MAIN} fill="none" />
      <rect x={120} y={220} width={160} height={20} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <text x={200} y={262} textAnchor="middle" className={LABEL}>
        Choker — reduced WLL at choke point
      </text>
    </DiagramFrame>
  );
}

function BasketHitch() {
  return (
    <DiagramFrame>
      <circle cx={200} cy={40} r={7} className={MAIN} fill="none" />
      <path d="M 120 220 L 120 50 L 200 40 L 280 50 L 280 220" className={MAIN} fill="none" />
      <rect x={120} y={220} width={160} height={20} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <text x={200} y={262} textAnchor="middle" className={LABEL}>
        Basket — both legs share vertical load
      </text>
    </DiagramFrame>
  );
}

function VerticalHitch() {
  return (
    <DiagramFrame>
      <circle cx={200} cy={40} r={7} className={MAIN} fill="none" />
      <line x1={200} y1={47} x2={200} y2={220} className={MAIN} />
      <rect x={140} y={220} width={120} height={20} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <text x={200} y={262} textAnchor="middle" className={LABEL}>
        Vertical hitch — full WLL per leg (symmetric model)
      </text>
    </DiagramFrame>
  );
}

function BasketVerticalVsInclined() {
  const titleLabel = "fill-foreground text-[13px] font-bold";
  const noteLabel = "fill-foreground/85 text-[11px] font-medium";
  const highlightLabel = "fill-foreground text-[12px] font-bold";
  const panel = "fill-foreground/[0.04] stroke-foreground/12 stroke-[1]";
  const leg = "stroke-foreground stroke-[3] fill-none";

  return (
    <DiagramFrame className="max-w-none max-h-full" viewBox="0 0 480 280">
      {/* Vertical basket — U with parallel vertical legs */}
      <rect x={16} y={4} width={212} height={228} rx={3} className={panel} />
      <text x={122} y={26} textAnchor="middle" className={titleLabel}>
        Vertical legs
      </text>
      <circle cx={86} cy={48} r={6} className="fill-foreground" />
      <circle cx={158} cy={48} r={6} className="fill-foreground" />
      <path d="M 86 54 L 86 160 Q 86 190 122 190 Q 158 190 158 160 L 158 54" className={leg} />
      <rect x={96} y={138} width={52} height={28} className="fill-foreground/20 stroke-foreground stroke-[1.5]" />
      <text x={122} y={214} textAnchor="middle" className={highlightLabel}>
        Up to 200% WLL
      </text>
      <text x={122} y={232} textAnchor="middle" className={noteLabel}>
        Legs plumb · load balanced
      </text>

      {/* Inclined basket — triangle to one point */}
      <rect x={252} y={4} width={212} height={228} rx={3} className={panel} />
      <text x={358} y={26} textAnchor="middle" className={titleLabel}>
        Inclined legs
      </text>
      <circle cx={358} cy={48} r={7} className="fill-foreground" />
      <line x1={304} y1={176} x2={358} y2={55} className={leg} />
      <line x1={412} y1={176} x2={358} y2={55} className={leg} />
      <line x1={304} y1={176} x2={412} y2={176} className="stroke-foreground/40 stroke-[1.5] stroke-dasharray-[4_3]" />
      <rect x={322} y={164} width={72} height={24} className="fill-foreground/20 stroke-foreground stroke-[1.5]" />
      <path d="M 310 176 A 22 22 0 0 0 322 158" className={ACCENT} fill="none" />
      <text x={300} y={168} textAnchor="end" className={LABEL}>
        θ
      </text>
      <text x={358} y={214} textAnchor="middle" className={highlightLabel}>
        Apply angle derating
      </text>
      <text x={358} y={232} textAnchor="middle" className={noteLabel}>
        Lower θ → higher leg tension
      </text>

      <text x={240} y={268} textAnchor="middle" className={noteLabel}>
        Same basket hitch · different geometry = different capacity
      </text>
    </DiagramFrame>
  );
}

function OpposingChokes() {
  const titleLabel = "fill-foreground text-[13px] font-bold";
  const noteLabel = "fill-foreground/85 text-[11px] font-medium";
  const sling = "stroke-foreground stroke-[2.75] fill-none";
  const pipeFill = "fill-foreground/[0.06] stroke-foreground/50 stroke-[1.5]";
  const arrow = "stroke-foreground stroke-[1.75] fill-none";

  return (
    <DiagramFrame className="max-w-none max-h-full" viewBox="0 0 520 285">
      <defs>
        <marker id="opp-choke-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" className="fill-foreground" />
        </marker>
      </defs>

      {/* Hook */}
      <circle cx={260} cy={26} r={8} className={MAIN} fill="none" />

      {/* Cylindrical load */}
      <ellipse cx={90} cy={190} rx={26} ry={40} className={pipeFill} />
      <rect x={90} y={150} width={340} height={80} className="fill-foreground/[0.06]" />
      <line x1={90} y1={150} x2={430} y2={150} className="stroke-foreground/50 stroke-[1.5]" />
      <line x1={90} y1={230} x2={430} y2={230} className="stroke-foreground/50 stroke-[1.5]" />
      <ellipse cx={430} cy={190} rx={26} ry={40} className={pipeFill} />

      {/* Left choker — choke eye on near (front) side, wrap clockwise */}
      <path d="M 170 34 L 260 34" className={sling} />
      <path d="M 170 34 L 158 155" className={sling} />
      {/* Wrap around cylinder */}
      <path d="M 158 155 Q 140 175 158 210 Q 176 235 198 210 Q 210 190 198 168" className={sling} />
      {/* Body through eye */}
      <path d="M 198 168 L 170 150" className={sling} />
      <ellipse cx={168} cy={152} rx={12} ry={9} className="stroke-foreground stroke-[2.25] fill-background" />

      {/* Right choker — choke eye on far (back) side, wrap counter-clockwise */}
      <path d="M 350 34 L 260 34" className={sling} />
      <path d="M 350 34 L 362 155" className={sling} />
      <path d="M 362 155 Q 380 175 362 210 Q 344 235 322 210 Q 310 190 322 168" className={sling} />
      <path d="M 322 168 L 350 150" className={sling} />
      <ellipse cx={352} cy={152} rx={12} ry={9} className="stroke-foreground stroke-[2.25] fill-background" />

      {/* Opposite-direction arrows */}
      <path d="M 145 218 A 28 22 0 0 1 205 218" className={arrow} markerEnd="url(#opp-choke-arrow)" />
      <path d="M 375 218 A 28 22 0 0 0 315 218" className={arrow} markerEnd="url(#opp-choke-arrow)" />

      <text x={170} y={120} textAnchor="middle" className={titleLabel}>
        Choke A
      </text>
      <text x={350} y={120} textAnchor="middle" className={titleLabel}>
        Choke B
      </text>
      <text x={175} y={252} textAnchor="middle" className={LABEL}>
        wrap →
      </text>
      <text x={345} y={252} textAnchor="middle" className={LABEL}>
        ← wrap
      </text>

      {/* Even spacing */}
      <line
        x1={170}
        y1={88}
        x2={350}
        y2={88}
        className="stroke-foreground/40 stroke-[1.25] stroke-dasharray-[4_3]"
      />
      <text x={260} y={82} textAnchor="middle" className={LABEL}>
        even spacing · balanced share
      </text>

      <text x={260} y={278} textAnchor="middle" className={noteLabel}>
        Pipe · poles · logs · structural steel
      </text>
    </DiagramFrame>
  );
}

function EdgeProtection() {
  return (
    <DiagramFrame viewBox="0 0 400 280">
      <path d="M 80 200 L 200 60 L 320 200 Z" className={MAIN} fill="hsl(var(--foreground) / 0.06)" />
      <rect x={175} y={175} width={50} height={14} className={ACCENT} fill="hsl(var(--foreground) / 0.2)" />
      <text x={200} y={186} textAnchor="middle" className={LABEL}>
        pad
      </text>
      <path d="M 200 55 Q 160 130 185 200" className={MAIN} fill="none" />
      <text x={148} y={130} className={LABEL}>
        sling
      </text>
      <text x={200} y={248} textAnchor="middle" className={LABEL}>
        Protect the sling at the edge — not the edge itself (15.39)
      </text>
    </DiagramFrame>
  );
}

function DesignFactor() {
  return (
    <DiagramFrame viewBox="0 0 400 260">
      <rect x={60} y={80} width={280} height={28} className={MAIN} fill="hsl(var(--foreground) / 0.15)" />
      <text x={200} y={98} textAnchor="middle" className={LABEL}>
        Breaking strength
      </text>
      <rect x={140} y={150} width={120} height={28} className={MAIN} fill="hsl(var(--foreground) / 0.35)" />
      <text x={200} y={168} textAnchor="middle" className={LABEL}>
        WLL
      </text>
      <line x1={200} y1={108} x2={200} y2={148} className={DIM} strokeDasharray="4 4" />
      <text x={215} y={132} className={LABEL}>
        DF = 5
      </text>
      <text x={200} y={220} textAnchor="middle" className={LABEL}>
        Design factor = breaking strength ÷ WLL
      </text>
    </DiagramFrame>
  );
}

function SlingDesignFactors() {
  const titleLabel = "fill-foreground text-[13px] font-bold";
  const noteLabel = "fill-foreground/85 text-[11px] font-medium";
  const valueLabel = "fill-foreground text-[14px] font-bold";
  const bars = [
    { label: "Alloy chain", factor: "4:1", width: 128, accent: false },
    { label: "Wire rope", factor: "5:1", width: 160, accent: true },
    { label: "Synthetic web", factor: "5:1", width: 160, accent: true },
    { label: "Roundsling", factor: "5:1", width: 160, accent: true },
    { label: "Synthetic rope", factor: "5:1", width: 160, accent: true },
    { label: "Metal mesh", factor: "5:1", width: 160, accent: true },
  ];
  const left = 150;
  const top = 48;
  const rowH = 32;

  return (
    <DiagramFrame className="max-w-none max-h-full" viewBox="0 0 420 280">
      <text x={210} y={24} textAnchor="middle" className={titleLabel}>
        Minimum design factors · ASME B30.9
      </text>
      {bars.map((bar, i) => {
        const y = top + i * rowH;
        return (
          <g key={bar.label}>
            <text x={left - 10} y={y + 16} textAnchor="end" className={LABEL}>
              {bar.label}
            </text>
            <rect
              x={left}
              y={y + 2}
              width={bar.width}
              height={20}
              className={
                bar.accent
                  ? "fill-foreground/25 stroke-foreground stroke-[1.5]"
                  : "fill-foreground/12 stroke-foreground/70 stroke-[1.5]"
              }
            />
            <text x={left + bar.width + 10} y={y + 17} className={valueLabel}>
              {bar.factor}
            </text>
          </g>
        );
      })}
      <text x={210} y={268} textAnchor="middle" className={noteLabel}>
        WLL = Breaking Strength ÷ Design Factor
      </text>
    </DiagramFrame>
  );
}

function WeakestLink() {
  return (
    <DiagramFrame viewBox="0 0 400 260">
      <rect x={40} y={110} width={70} height={36} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <rect x={130} y={110} width={70} height={36} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <rect x={220} y={110} width={70} height={36} className={ACCENT} fill="hsl(var(--foreground) / 0.25)" strokeWidth={3} />
      <rect x={310} y={110} width={50} height={36} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <text x={55} y={133} className={LABEL}>
        hook
      </text>
      <text x={142} y={133} className={LABEL}>
        shackle
      </text>
      <text x={228} y={133} className={LABEL}>
        sling
      </text>
      <text x={318} y={133} className={LABEL}>
        load
      </text>
      <text x={200} y={200} textAnchor="middle" className={LABEL}>
        Assembly limited by weakest component
      </text>
    </DiagramFrame>
  );
}

function LandBeforeDetach() {
  return (
    <DiagramFrame viewBox="0 0 400 280">
      <text x={110} y={36} textAnchor="middle" className={LABEL}>
        OK — landed
      </text>
      <rect x={50} y={180} width={120} height={24} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <rect x={70} y={204} width={20} height={30} className={DIM} />
      <rect x={130} y={204} width={20} height={30} className={DIM} />
      <line x1={110} y1={50} x2={110} y2={180} className={ACCENT} strokeDasharray="6 4" />
      <text x={290} y={36} textAnchor="middle" className={LABEL}>
        NOT OK — suspended
      </text>
      <rect x={230} y={200} width={120} height={24} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <line x1={290} y1={50} x2={290} y2={200} className={MAIN} />
      <circle cx={290} cy={42} r={7} className={MAIN} fill="none" />
      <text x={200} y={262} textAnchor="middle" className={LABEL}>
        OHSR 15.3 — land and support before unhooking
      </text>
    </DiagramFrame>
  );
}

function SpreaderBar() {
  return (
    <DiagramFrame viewBox="0 0 400 300">
      <circle cx={200} cy={42} r={7} className={MAIN} fill="none" />
      <line x1={200} y1={49} x2={200} y2={90} className={MAIN} />
      <line x1={80} y1={90} x2={320} y2={90} className={MAIN} strokeWidth={3} />
      <text x={200} y={82} textAnchor="middle" className={LABEL}>
        spreader bar
      </text>
      <line x1={80} y1={90} x2={80} y2={210} className={MAIN} />
      <line x1={320} y1={90} x2={320} y2={210} className={MAIN} />
      <rect x={40} y={210} width={320} height={24} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <text x={200} y={258} textAnchor="middle" className={LABEL}>
        Wider included angle — lower leg tension
      </text>
    </DiagramFrame>
  );
}

function WireRopeBroken() {
  return (
    <DiagramFrame viewBox="0 0 400 260">
      <path d="M 40 130 Q 120 110 200 130 T 360 130" className={MAIN} fill="none" />
      {[100, 160, 220, 280].map((x) => (
        <line key={x} x1={x} y1={118} x2={x + 8} y2={142} className={ACCENT} />
      ))}
      <text x={200} y={50} textAnchor="middle" className={LABEL}>
        3-6 rule — broken wires in one lay
      </text>
      <text x={200} y={220} textAnchor="middle" className={LABEL}>
        Remove from service per OHSR 15.25
      </text>
    </DiagramFrame>
  );
}

function HookThroat() {
  return (
    <DiagramFrame viewBox="0 0 400 280">
      <path d="M 160 200 Q 160 80 240 80 Q 300 80 300 140 Q 300 200 240 200" className={MAIN} fill="none" />
      <line x1={160} y1={200} x2={240} y2={200} className={ACCENT} />
      <text x={200} y={218} textAnchor="middle" className={LABEL}>
        throat opening
      </text>
      <text x={200} y={48} textAnchor="middle" className={LABEL}>
        Reject: cracks, deformation, excessive throat opening
      </text>
    </DiagramFrame>
  );
}

function LiftExclusion() {
  return (
    <DiagramFrame viewBox="0 0 400 300">
      <circle cx={200} cy={200} r={100} className={ACCENT} fill="none" strokeDasharray="8 6" />
      <line x1={200} y1={40} x2={200} y2={120} className={MAIN} />
      <circle cx={200} cy={32} r={7} className={MAIN} fill="none" />
      <rect x={160} y={200} width={80} height={28} className={MAIN} fill="hsl(var(--foreground) / 0.1)" />
      <text x={200} y={48} textAnchor="middle" className={LABEL}>
        No personnel under load
      </text>
      <text x={200} y={278} textAnchor="middle" className={LABEL}>
        Exclusion zone — clear swing and landing area
      </text>
    </DiagramFrame>
  );
}

function PlateDimensions() {
  return (
    <DiagramFrame viewBox="0 0 400 260">
      <rect x={100} y={70} width={200} height={120} className={MAIN} fill="hsl(var(--foreground) / 0.08)" />
      <line x1={100} y1={210} x2={300} y2={210} className={DIM} />
      <text x={200} y={228} textAnchor="middle" className={LABEL}>
        L
      </text>
      <line x1={80} y1={70} x2={80} y2={190} className={DIM} />
      <text x={68} y={135} textAnchor="middle" className={LABEL} transform="rotate(-90 68 135)">
        W
      </text>
      <text x={200} y={130} textAnchor="middle" className={LABEL}>
        t × 40.8 lb/ft²/in
      </text>
    </DiagramFrame>
  );
}

const STAT_LABEL = "fill-foreground slide-stats-chart-body text-[12px]";
const STAT_MUTED = "fill-[hsl(var(--muted-foreground))] slide-stats-chart-body";

function CanadaRiggingStatsChart() {
  const causeBars: { label: string; pct: number; highlight?: boolean }[] = [
    { label: "Worker contact", pct: 34 },
    { label: "Crane overturn", pct: 19 },
    { label: "Boom collapse", pct: 19 },
    { label: "Dropped load", pct: 10 },
    { label: "Rigging failure", pct: 6, highlight: true },
    { label: "Other", pct: 12 },
  ];
  const maxPct = 34;
  const barMaxW = 152;
  const labelX = 124;
  const barStartX = labelX + 8;

  return (
    <DiagramFrame viewBox="0 0 400 248" className="max-w-none">
      <text x={20} y={24} className="fill-foreground slide-stats-chart-display text-[12px] font-bold">
        Crane accident causes
      </text>
      <text x={20} y={42} className={cn(STAT_MUTED, "text-[11px]")}>
        Wiethorn review — rigging highlighted
      </text>

      <rect
        x={20}
        y={50}
        width={360}
        height={42}
        fill="hsl(var(--highlight) / 0.15)"
        stroke="hsl(var(--highlight))"
        strokeWidth={1.5}
      />
      <text x={36} y={78} className="fill-highlight font-display text-[24px] font-bold tracking-wide">
        6%
      </text>
      <text x={84} y={70} className="fill-foreground slide-stats-chart-display text-[11px] font-bold">
        rigging failure
      </text>
      <text x={84} y={86} className={cn(STAT_MUTED, "text-[11px]")}>
        56.7% of those — no softeners
      </text>

      {causeBars.map((row, i) => {
        const y = 102 + i * 22;
        const w = (row.pct / maxPct) * barMaxW;
        const isHighlight = Boolean(row.highlight);
        const pctX = Math.min(barStartX + w + 6, 388);
        return (
          <g key={row.label}>
            <text x={labelX} y={y + 11} textAnchor="end" className={STAT_LABEL}>
              {row.label}
            </text>
            <rect
              x={barStartX}
              y={y + 1}
              width={w}
              height={13}
              fill={isHighlight ? "hsl(var(--highlight))" : "hsl(var(--foreground) / 0.2)"}
            />
            <text x={pctX} y={y + 11} className={cn(STAT_LABEL, "font-semibold")}>
              {row.pct}%
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

const DIAGRAMS: Record<RiggingDiagramId, ReactNode> = {
  "sling-bridle-90": <SlingBridle angleDeg={90} multiplier="1.0" />,
  "sling-bridle-60": <SlingBridle angleDeg={60} multiplier="1.155" />,
  "sling-bridle-45": <SlingBridle angleDeg={45} multiplier="1.414" />,
  "sling-bridle-30": <SlingBridle angleDeg={30} multiplier="2.0" />,
  "sling-bridle-intro": <SlingBridle angleDeg={45} />,
  "bridle-math-lh": <BridleMathLhDiagram />,
  "force-triangle": <ForceTriangle />,
  "leg-included-angle": <LegIncludedAngle />,
  "tension-multiplier-chart": <TensionMultiplierChart />,
  "horizontal-compression": <HorizontalCompression />,
  "bucket-compression": <BucketCompression />,
  "sling-angle-slopes": <SlingAngleSlopes />,
  "sling-tension-sine": <SlingTensionSine />,
  "cog-centered": <CogCentered />,
  "cog-offset": <CogOffset />,
  "cog-complex": <CogComplex />,
  "three-leg-bridle": <ThreeLegBridle />,
  "load-moment": <LoadMoment />,
  "volume-block": <VolumeBlock />,
  "choker-hitch": <ChokerHitch />,
  "basket-hitch": <BasketHitch />,
  "vertical-hitch": <VerticalHitch />,
  "basket-vertical-vs-inclined": <BasketVerticalVsInclined />,
  "opposing-chokes": <OpposingChokes />,
  "edge-protection": <EdgeProtection />,
  "design-factor": <DesignFactor />,
  "sling-design-factors": <SlingDesignFactors />,
  "weakest-link": <WeakestLink />,
  "land-before-detach": <LandBeforeDetach />,
  "spreader-bar": <SpreaderBar />,
  "wire-rope-broken": <WireRopeBroken />,
  "hook-throat": <HookThroat />,
  "lift-exclusion": <LiftExclusion />,
  "plate-dimensions": <PlateDimensions />,
  "canada-rigging-stats": <CanadaRiggingStatsChart />,
};

export function isRiggingDiagramId(value: string): value is RiggingDiagramId {
  return value in DIAGRAMS;
}

type Props = {
  readonly id: RiggingDiagramId;
  readonly className?: string;
  readonly caption?: string;
  readonly variant?: "default" | "slide" | "slide-large";
};

export function RiggingDiagram({ id, className, caption, variant = "default" }: Props) {
  const isSlide = variant === "slide" || variant === "slide-large";
  const isLarge = variant === "slide-large";
  return (
    <figure className={cn("not-prose", isSlide ? "my-0 w-full" : "my-4", isLarge && "flex h-full min-h-0 flex-col", className)}>
      <div
        className={cn(
          isSlide
            ? "flex h-full min-h-0 w-full items-center justify-center"
            : "rounded-sm bg-foreground/[0.03] px-3 py-4 sm:px-5 sm:py-5"
        )}
      >
        <div
          className={cn(
            isSlide && "w-full",
            isLarge
              ? "[&_svg]:h-auto [&_svg]:max-h-full [&_svg]:w-full"
              : isSlide && "[&_svg]:h-auto [&_svg]:max-h-[min(34vh,240px)] [&_svg]:w-full"
          )}
        >
          {DIAGRAMS[id]}
        </div>
      </div>
      {caption ? <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}

/** Bridle with optional worked-load label for example slides */
export function SlingBridleDiagram({
  angleDeg,
  multiplier,
  loadWeight,
  className,
}: {
  readonly angleDeg: number;
  readonly multiplier?: string;
  readonly loadWeight?: string;
  readonly className?: string;
}) {
  return (
    <figure className={cn("not-prose", className)}>
      <div className="rounded-sm bg-foreground/[0.03] px-3 py-4 sm:px-5 sm:py-5">
        <SlingBridle angleDeg={angleDeg} multiplier={multiplier} loadWeight={loadWeight} />
      </div>
    </figure>
  );
}
