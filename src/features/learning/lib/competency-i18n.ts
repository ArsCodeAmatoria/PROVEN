import type { Locale } from "@/features/learning/i18n/config";
import type { TrackSlug } from "@/features/learning/lib/tracks";
import { getSlideCourse } from "@/features/learning/lib/competency-course";

const ES_RIGGER = {
  competencies: [
    "Regulaciones y normas (OHSR Parte 15, aparejador calificado, WLL, identificación)",
    "WLL, factor de diseño, resistencia a la rotura, tipos de enganche, límites del conjunto",
    "Suavizadores y protección de bordes afilados (OHSR 15.39)",
    "Inspección previa al uso y criterios de retiro por tipo de equipo",
    "Matemáticas de aparejo: tablas de peso, peso de carga, conversiones, tensión de eslinga, ángulos, CdG, izajes asimétricos",
    "Accesorios bajo el gancho y planificación de izajes",
    "Izajes críticos y cierre del curso",
  ],
};

const ES_PRO = {
  title: "Curso de diapositivas de aparejo profesional",
  description:
    "Diapositivas avanzadas — pinzas verticales para placas, barras separadoras, vigas de izaje y tensión asimétrica de eslingas. Para aparejadores con fundamentos de competencia.",
  competencies: [
    "Pinzas verticales para placas — garras, espesor y rigging gemelo",
    "Barras separadoras — ángulos, compresión y modos de falla",
    "Vigas de izaje — momento flector y bridles superiores",
    "Tensión no simétrica — CdG, piernas desiguales y verificación en campo",
    "Integración de dispositivos e izajes críticos",
  ],
};

const RIGGER_COMPETENCIES_EN = [
  "Regulations & standards (OHSR Part 15, qualified rigger, WLL, identification)",
  "WLL, design factor, breaking strength, hitch types, assembly limits",
  "Softeners and sharp-edge protection (OHSR 15.39)",
  "Pre-use inspection and removal criteria by gear type",
  "Rigging math: weight charts, load weight, conversions, sling tension, angles, COG, non-symmetrical picks",
  "Below-the-hook attachments and lift planning",
  "Critical lifts and course wrap-up",
];

const PRO_COMPETENCIES_EN = [
  "Vertical plate clamps — jaws, thickness range, twin-clamp rigging",
  "Spreader bars — angles, compression, and failure modes",
  "Lifting beams — bending moment and top bridles",
  "Non-symmetric tension — COG offset, unequal legs, field verification",
  "Combining devices and critical lift planning",
];

export function getLocalizedCompetencyCourse(locale: Locale, track: TrackSlug = "rigger-competency") {
  const course = getSlideCourse(track, locale);

  if (locale === "es") {
    const es = track === "intermediate" ? ES_PRO : ES_RIGGER;
    return {
      title: course.title,
      description: course.description,
      units: course.units,
      competencies: es.competencies,
    };
  }

  const enCourse = getSlideCourse(track, "en");
  return {
    title: enCourse.title,
    description: enCourse.description,
    units: enCourse.units,
    competencies: track === "intermediate" ? PRO_COMPETENCIES_EN : RIGGER_COMPETENCIES_EN,
  };
}

export function formatDurationLocalized(minutes: number, locale: Locale): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === "es") {
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}
