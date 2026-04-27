import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

const COVERED_ROUTE_FILES = new Set([
  "app/api/analytics/dashboard/route.ts",
  "app/api/analytics/overview/route.ts",
  "app/api/appointments/[id]/route.ts",
  "app/api/appointments/doctors/route.ts",
  "app/api/appointments/route.ts",
  "app/api/audit/logs/route.ts",
  "app/api/auth/active-role/route.ts",
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/me/route.ts",
  "app/api/auth/register/route.ts",
  "app/api/auth/status/route.ts",
  "app/api/backend/[...path]/route.ts",
  "app/api/clinical/diagnoses/[code]/recommended-tests/route.ts",
  "app/api/clinical/diagnoses/route.ts",
  "app/api/clinical/icd10/route.ts",
  "app/api/clinical/tests/route.ts",
  "app/api/consultations/save/route.ts",
  "app/api/encounters/[id]/route.ts",
  "app/api/encounters/route.ts",
  "app/api/families/route.ts",
  "app/api/inventory/[id]/adjust-stock/route.ts",
  "app/api/inventory/[id]/batches/route.ts",
  "app/api/inventory/[id]/movements/route.ts",
  "app/api/inventory/[id]/route.ts",
  "app/api/inventory/alerts/route.ts",
  "app/api/inventory/reports/route.ts",
  "app/api/inventory/route.ts",
  "app/api/inventory/search/route.ts",
  "app/api/patients/[id]/allergies/route.ts",
  "app/api/patients/[id]/conditions/route.ts",
  "app/api/patients/[id]/consultations/route.ts",
  "app/api/patients/[id]/family/route.ts",
  "app/api/patients/[id]/history/route.ts",
  "app/api/patients/[id]/profile/route.ts",
  "app/api/patients/[id]/route.ts",
  "app/api/patients/[id]/timeline/route.ts",
  "app/api/patients/[id]/vitals/route.ts",
  "app/api/patients/route.ts",
  "app/api/prescriptions/[id]/dispense/route.ts",
  "app/api/prescriptions/[id]/route.ts",
  "app/api/prescriptions/queue/pending-dispense/route.ts",
  "app/api/reports/[reportType]/route.ts",
  "app/api/reports/daily-summary/history/route.ts",
  "app/api/reports/daily-summary/route.ts",
  "app/api/tasks/[id]/complete/route.ts",
  "app/api/tasks/[id]/route.ts",
  "app/api/tasks/route.ts",
  "app/api/users/[id]/route.ts",
  "app/api/users/route.ts",
  "app/api/visits/start/route.ts",
]);

function collectRouteFiles(startDir: string): string[] {
  const entries = readdirSync(startDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(startDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name === "route.ts") {
      files.push(relative(process.cwd(), fullPath).replaceAll("\\", "/"));
    }
  }

  return files;
}

describe("api route-file coverage guard", () => {
  it("tracks every app/api route.ts file in the explicit coverage set", () => {
    const routeFiles = collectRouteFiles(join(process.cwd(), "app", "api")).sort();
    const coveredFiles = Array.from(COVERED_ROUTE_FILES).sort();

    expect(coveredFiles).toEqual(routeFiles);
  });
});
