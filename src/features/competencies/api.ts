import "server-only";

import { DEFAULT_ORGANIZATION_ID } from "@/lib/constants";
import { listCompetencies } from "@/services/competencies.service";

export { DEFAULT_ORGANIZATION_ID };

export async function getCompetencyModuleData() {
  return listCompetencies(DEFAULT_ORGANIZATION_ID);
}
