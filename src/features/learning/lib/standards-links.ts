export type StandardLogoId = "worksafebc" | "bccsa" | "asme" | "ansi" | "csa" | "en" | "fem";

export const STANDARD_URLS = {
  worksafebc: "https://www.worksafebc.com/",
  ohrsPart14:
    "https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation-part-14",
  ohrsPart15:
    "https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation-part-15",
  bccsa: "https://bccranesafety.ca/",
  bccsaCompetency:
    "https://bccranesafety.ca/rigger-competency-a-critical-safety-standard-under-ohsr-part-15/",
  ansi: "https://www.ansi.org/standards",
  asmeB30:
    "https://www.asme.org/codes-standards/find-codes-standards/b30-safety-standards-cableways-cranes-derricks-hoists-hooks-jacks-and-slings",
  asmeB303: "https://www.asme.org/codes-standards/b30-3-tower-cranes",
  asmeB305: "https://www.asme.org/codes-standards/b30-5-mobile-and-locomotive-cranes",
  asmeB309: "https://www.asme.org/codes-standards/b30-9-slings",
  asmeB3010: "https://www.asme.org/codes-standards/b30-10-hooks",
  asmeB3020: "https://www.asme.org/codes-standards/b30-20-below-the-hook-lifting-devices",
  asmeB3026: "https://www.asme.org/codes-standards/b30-26-rigging-hardware",
  csaZ248: "https://www.csagroup.org/store/product/Z248-26/",
  csaZ150: "https://www.csagroup.org/store/product/Z150-20/",
  en13155: "https://www.en-standard.eu/din-en-13155-cranes-safety-non-fixed-load-lifting-attachments/",
  fem: "https://www.fem-eur.com/",
} as const;

/** Cited on slide 3 — rigging / crane accident statistics */
export const RIGGING_STATS_URLS = {
  bcGovCraneLicensing:
    "https://news.gov.bc.ca/releases/2026LBR0004-000211",
  worksafebcTowerCraneSafety:
    "https://www.worksafebc.com/en/about-us/news-events/news-releases/2024/March/worksafebc-bringing-industry-labour-stakeholders-together-discuss-crane-safety",
  worksafebcRiggingBulletin:
    "https://www.worksafebc.com/en/resources/health-safety/bulletins/preventing-crane-rigging-failures",
  worksafebcTowerCranes:
    "https://www.worksafebc.com/en/health-safety/tools-machinery-equipment/cranes-mobile-equipment/types/tower-cranes",
  awcbcFatalities:
    "https://awcbc.org/data-and-statistics/national-work-injury-disease-statistics-program",
  wiethornCraneAccidentStudy:
    "https://ccra-aclg.ca/wp-content/uploads/2024/02/JimWiethorn-CraneAccidentReport.pdf",
} as const;
