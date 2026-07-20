export const FLAT_TOP_COVER_IMAGE = "/images/flat-top.png";

export const FLAT_TOP_COVER_ALT = "Flat-top tower crane against a clear sky";

export const LUFFER_COVER_IMAGE = "/images/luffer.png";

export const LUFFER_COVER_ALT = "Luffer crane on a construction site";

export const SELF_CLOSING_COVER_IMAGE = "/images/rigging/self-closing.png";

export const SELF_CLOSING_COVER_ALT = "Self-closing tower crane on a construction site";

export function coverImageAlt(src: string): string {
  if (src.includes("luffer")) return LUFFER_COVER_ALT;
  if (src.includes("self-closing")) return SELF_CLOSING_COVER_ALT;
  if (src.includes("flat-top")) return FLAT_TOP_COVER_ALT;
  return "Course cover image";
}

export const EDGE_PROTECTION_IMAGE = "/images/rigging/edge-protection.png";

export const EDGE_PROTECTION_IMAGE_ALT =
  "Rigging sling with edge protection pad at a sharp steel corner";

export const LW_RATIO_IMAGE = "/images/rigging/l-w.png";

export const LW_RATIO_IMAGE_ALT =
  "Bridle sling diagram labeling vertical height H and sling leg length L at 45 degrees";

export const SOFTENER_IMAGE = "/images/rigging/softner.png";

export const SOFTENER_IMAGE_ALT =
  "Blue sling with yellow softener pad and straps at a sharp corner";

export const BLOCK_IMAGE = "/images/rigging/block.png";

export const BLOCK_IMAGE_ALT =
  "Weathered crane block and hook with worn paint and rust";

export const PILE_SHACKLE_IMAGE = "/images/rigging/pile-shackle.png";

export const PILE_SHACKLE_IMAGE_ALT =
  "Pile of assorted rigging shackles showing manufacturer stamps and WLL markings";

export const HOOKS_IMAGE = "/images/rigging/hooks.png";

export const HOOKS_IMAGE_ALT =
  "Assorted crane hooks showing throat, latch, and identification markings";

export const CHAIN_IMAGE = "/images/rigging/chain.png";

export const CHAIN_IMAGE_ALT =
  "Alloy hoisting chain sling with master link, identification tag, and coupling hardware";

export const BRIDLE_IMAGE = "/images/rigging/bridle.png";

export const BRIDLE_IMAGE_ALT =
  "Two-leg chain bridle sling with master link and latch hooks";

export const WIRE_ROPE_IMAGE = "/images/rigging/wirerope.png";

export const WIRE_ROPE_IMAGE_ALT =
  "Single-leg wire rope sling with blue ferrules and identification tag";

export const WIRE_CUT_IMAGE = "/images/rigging/wirecut.png";

export const WIRE_CUT_IMAGE_ALT =
  "Wire rope cross-section labeled core, strand, and wire";

export const WEB_SLING_IMAGE = "/images/rigging/websling.png";

export const WEB_SLING_IMAGE_ALT =
  "Yellow synthetic web sling with red eye reinforcement and load-bearing stitching";

export const WEB_SLING_TAG_IMAGE = "/images/rigging/webslingtag.png";

export const WEB_SLING_TAG_IMAGE_ALT =
  "Synthetic web sling identification tag showing manufacturer, material, and WLL by hitch";

export const ROUND_SLING_IMAGE = "/images/rigging/roundsling.png";

export const ROUND_SLING_IMAGE_ALT =
  "Synthetic round sling with protective cover and identification tag";

export const HITCH_IMAGE = "/images/rigging/hitch.png";

export const HITCH_IMAGE_ALT =
  "Synthetic sling hitch diagrams showing double choke and double wrap basket configurations";

export const HAMMER_CHOKE_IMAGE = "/images/rigging/hammerchoke.png";

export const HAMMER_CHOKE_IMAGE_ALT =
  "Choker hitch angle diagrams showing capacity reduction as the choke angle decreases";

export const SELFDUMP_IMAGE = "/images/rigging/selfdump.png";

export const SELFDUMP_IMAGE_ALT =
  "Yellow self-dumping hopper suspended from a lifting bail — underhook attachment example";

export const CONCRETE_BUCKET_IMAGE = "/images/rigging/concretebucket.png";

export const CONCRETE_BUCKET_IMAGE_ALT =
  "Yellow concrete bucket with bail, discharge gate, and tubular support frame";

export const DEP_IMAGE = "/images/rigging/DEP.png";

export const DEP_IMAGE_ALT =
  "Differential evacuation platform (DEP) personnel manbasket with tarp cover and identification plate";

export const MANBASKET_IMAGE = "/images/rigging/manbasket.png";

export const MANBASKET_IMAGE_ALT =
  "Yellow personnel manbasket suspended on a four-leg wire rope bridle";
