import "server-only";

import { requireCompanyId } from "@/lib/auth/session";
import { listCompetencies } from "@/services/competencies.service";

/** @deprecated Prefer calling listCompetencies from pages directly. */
export async function getCompetencyModuleData() {
  const { companyId } = await requireCompanyId();
  return listCompetencies(companyId);
}
