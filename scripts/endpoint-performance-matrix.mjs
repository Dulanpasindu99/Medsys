import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import autocannon from "autocannon";

const FE_BASE = process.env.MEDSYS_FE_BASE ?? "http://localhost:3000";
const CONNECTIONS = Number(process.env.PERF_CONNECTIONS ?? 2);
const DURATION = Number(process.env.PERF_DURATION ?? 3);
const OVERALL_RATE = Number(process.env.PERF_OVERALL_RATE ?? 2);
const COOLDOWN_MS = Number(process.env.PERF_COOLDOWN_MS ?? 800);
const OWNER_LOGIN = {
  organizationSlug: process.env.PERF_ORG_SLUG ?? "default-clinic",
  email: process.env.PERF_OWNER_EMAIL ?? "owner@medsys.local",
  password: process.env.PERF_OWNER_PASSWORD ?? "ChangeMe123!",
  roleHint: "owner",
};

function collectRouteFiles(startDir) {
  const entries = readdirSync(startDir, { withFileTypes: true });
  const files = [];
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
  return files.sort();
}

function routePatternFromFile(routeFile) {
  const base = routeFile
    .replace(/^app\/api/, "/api")
    .replace(/\/route\.ts$/, "");
  if (base === "/api/backend/[...path]") {
    return "/api/backend/v1/auth/status";
  }
  return base;
}

function methodsFromFile(routeFile) {
  const source = readFileSync(routeFile, "utf8");
  const methods = new Set();
  for (const match of source.matchAll(/export\s+async\s+function\s+(GET|POST|PATCH|DELETE)\s*\(/g)) {
    methods.add(match[1]);
  }
  return Array.from(methods.values()).sort();
}

function normalizeCookies(setCookies) {
  const values = [];
  for (const row of setCookies) {
    const first = row.split(";")[0]?.trim();
    if (first) values.push(first);
  }
  return values.join("; ");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(path, cookieHeader) {
  const response = await fetch(`${FE_BASE}${path}`, {
    method: "GET",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json, text };
}

function firstNumberFromCandidates(candidates) {
  for (const value of candidates) {
    if (Number.isInteger(value) && value > 0) return value;
  }
  return undefined;
}

function firstStringFromCandidates(candidates) {
  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function pickFirstId(payload, keys = ["id"]) {
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (first && typeof first === "object") {
      return firstNumberFromCandidates(keys.map((key) => first[key]));
    }
    return undefined;
  }
  if (!payload || typeof payload !== "object") return undefined;
  const arrays = ["items", "data", "patients", "users", "appointments", "encounters", "inventory", "tasks", "doctors"];
  for (const key of arrays) {
    const candidate = payload[key];
    if (Array.isArray(candidate) && candidate.length > 0 && typeof candidate[0] === "object") {
      const id = firstNumberFromCandidates(keys.map((k) => candidate[0][k]));
      if (id) return id;
    }
  }
  return firstNumberFromCandidates(keys.map((key) => payload[key]));
}

async function buildProbeContext(cookieHeader) {
  const [patients, encounters, appointments, inventory, tasks, users, diagnoses] = await Promise.all([
    fetchJson("/api/patients", cookieHeader),
    fetchJson("/api/encounters", cookieHeader),
    fetchJson("/api/appointments", cookieHeader),
    fetchJson("/api/inventory", cookieHeader),
    fetchJson("/api/tasks", cookieHeader),
    fetchJson("/api/users", cookieHeader),
    fetchJson("/api/clinical/diagnoses?terms=a&limit=1", cookieHeader),
  ]);

  const patientId =
    pickFirstId(patients.json, ["id", "patientId"]) ??
    pickFirstId(appointments.json, ["patientId", "patient_id"]);
  const encounterId = pickFirstId(encounters.json, ["id", "encounterId"]);
  const appointmentId = pickFirstId(appointments.json, ["id", "appointmentId"]);
  const inventoryId = pickFirstId(inventory.json, ["id", "inventoryId"]);
  const taskId = pickFirstId(tasks.json, ["id", "taskId"]);
  const userId = pickFirstId(users.json, ["id", "userId"]);

  let diagnosisCode =
    firstStringFromCandidates([
      diagnoses?.json?.items?.[0]?.code,
      diagnoses?.json?.items?.[0]?.icd10Code,
      diagnoses?.json?.diagnoses?.[0]?.code,
      diagnoses?.json?.diagnoses?.[0]?.icd10Code,
    ]) ?? "A00";

  return {
    patientId: patientId ?? 1,
    encounterId: encounterId ?? 1,
    appointmentId: appointmentId ?? 1,
    inventoryId: inventoryId ?? 1,
    taskId: taskId ?? 1,
    userId: userId ?? 1,
    diagnosisCode,
  };
}

function resolvePath(pattern, context) {
  let path = pattern;
  if (path.includes("/patients/[id]")) path = path.replaceAll("[id]", String(context.patientId));
  if (path.includes("/encounters/[id]")) path = path.replaceAll("[id]", String(context.encounterId));
  if (path.includes("/appointments/[id]")) path = path.replaceAll("[id]", String(context.appointmentId));
  if (path.includes("/inventory/[id]")) path = path.replaceAll("[id]", String(context.inventoryId));
  if (path.includes("/tasks/[id]")) path = path.replaceAll("[id]", String(context.taskId));
  if (path.includes("/users/[id]")) path = path.replaceAll("[id]", String(context.userId));
  if (path.includes("/clinical/diagnoses/[code]")) {
    path = path.replace("[code]", encodeURIComponent(context.diagnosisCode));
  }
  if (path.includes("[id]")) {
    path = path.replaceAll("[id]", "1");
  }
  if (path === "/api/reports/doctor-performance") return `${path}?range=30d`;
  if (path === "/api/reports/daily-summary/history") return `${path}?limit=10`;
  if (path === "/api/inventory/alerts") return `${path}?days=30`;
  if (path === "/api/inventory/reports") return `${path}?days=30`;
  if (path === "/api/inventory/search") return `${path}?q=ab&limit=5`;
  if (path === "/api/clinical/diagnoses") return `${path}?terms=a&limit=5`;
  if (path === "/api/clinical/tests") return `${path}?terms=a&limit=5`;
  if (path === "/api/clinical/icd10") return `${path}?terms=a&limit=5`;
  if (path === "/api/appointments") return `${path}?status=waiting`;
  return path;
}

function expandPaths(pattern, context) {
  if (pattern === "/api/reports/[reportType]") {
    return [
      "/api/reports/clinic-overview?range=30d",
      "/api/reports/doctor-performance?range=30d",
      "/api/reports/assistant-performance?range=30d",
      "/api/reports/inventory-usage?range=30d",
      "/api/reports/patient-followup?range=30d",
    ];
  }

  return [resolvePath(pattern, context)];
}

async function runAutocannon(url, cookieHeader) {
  try {
    const result = await new Promise((resolve, reject) => {
      autocannon(
        {
          url,
          method: "GET",
          connections: CONNECTIONS,
          duration: DURATION,
          overallRate: OVERALL_RATE,
          headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        },
        (error, output) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(output);
        }
      );
    });
    return { ok: true, payload: result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function calcRow(routeFile, path, payload) {
  const total = Number(payload?.requests?.total ?? 0);
  const ok2xx = Number(payload?.["2xx"] ?? 0);
  const c4xx = Number(payload?.["4xx"] ?? 0);
  const c5xx = Number(payload?.["5xx"] ?? 0);
  const c429 = Number(payload?.statusCodeStats?.["429"]?.count ?? 0);
  const errors = Number(payload?.errors ?? 0);
  const timeouts = Number(payload?.timeouts ?? 0);
  const successPct = total > 0 ? (ok2xx / total) * 100 : 0;
  const successRpm = Number(((ok2xx / DURATION) * 60).toFixed(1));
  const totalRpm = Number(((total / DURATION) * 60).toFixed(1));
  return {
    routeFile,
    method: "GET",
    path,
    durationSec: DURATION,
    connections: CONNECTIONS,
    totalRequests: total,
    success2xx: ok2xx,
    status4xx: c4xx,
    status5xx: c5xx,
    status429: c429,
    errors,
    timeouts,
    successPct: Number(successPct.toFixed(2)),
    latencyAvgMs: Number((payload?.latency?.average ?? 0).toFixed(2)),
    latencyP95Ms: Number((payload?.latency?.p97_5 ?? payload?.latency?.p95 ?? 0).toFixed(2)),
    reqPerSecAvg: Number((payload?.requests?.average ?? 0).toFixed(2)),
    throughputBytesPerSec: Number((payload?.throughput?.average ?? 0).toFixed(2)),
    successRpm,
    totalRpm,
  };
}

function toMarkdown(rows, skipped, meta) {
  const header = [
    "# Endpoint Performance Matrix",
    "",
    `- Generated at: ${new Date().toISOString()}`,
    `- Base URL: ${FE_BASE}`,
    `- Benchmark profile: GET, connections=${CONNECTIONS}, overallRate=${OVERALL_RATE} req/s, duration=${DURATION}s per endpoint`,
    `- Endpoint cooldown: ${COOLDOWN_MS}ms`,
    `- Auth role used: owner (${OWNER_LOGIN.email})`,
    "",
    "## Measured GET Endpoints",
    "",
    "| Endpoint | 2xx % | 2xx | 4xx | 5xx | 429 | Avg Latency (ms) | P95 (ms) | Success RPM | Total RPM |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  const lines = rows.map(
    (row) =>
      `| \`${row.path}\` | ${row.successPct} | ${row.success2xx}/${row.totalRequests} | ${row.status4xx} | ${row.status5xx} | ${row.status429} | ${row.latencyAvgMs} | ${row.latencyP95Ms} | ${row.successRpm} | ${row.totalRpm} |`
  );
  const skippedLines = [
    "",
    "## Skipped Routes",
    "",
    "| Route file | Reason |",
    "|---|---|",
    ...skipped.map((entry) => `| \`${entry.routeFile}\` | ${entry.reason} |`),
    "",
    "## Probe Context",
    "",
    "```json",
    JSON.stringify(meta, null, 2),
    "```",
    "",
  ];
  return [...header, ...lines, ...skippedLines].join("\n");
}

async function loginOwner() {
  const response = await fetch(`${FE_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(OWNER_LOGIN),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Owner login failed: ${response.status} ${text}`);
  }
  const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
  const setCookieRows = getSetCookie ? getSetCookie() : [];
  let cookieHeader = normalizeCookies(setCookieRows);
  if (!cookieHeader) {
    const maybeSingle = response.headers.get("set-cookie");
    cookieHeader = maybeSingle ? normalizeCookies([maybeSingle]) : "";
  }
  if (!cookieHeader) {
    throw new Error("Login succeeded but no auth cookie was returned.");
  }
  return cookieHeader;
}

async function main() {
  const cookieHeader = await loginOwner();
  const context = await buildProbeContext(cookieHeader);
  const routeFiles = collectRouteFiles(join(process.cwd(), "app", "api"));

  const rows = [];
  const skipped = [];

  for (const routeFile of routeFiles) {
    const methods = methodsFromFile(routeFile);
    if (!methods.includes("GET")) {
      skipped.push({ routeFile, reason: `No GET method (${methods.join(", ") || "none"})` });
      continue;
    }
    const pattern = routePatternFromFile(routeFile);
    const paths = expandPaths(pattern, context);
    for (const path of paths) {
      const url = `${FE_BASE}${path}`;
      const run = await runAutocannon(url, cookieHeader);
      if (!run.ok) {
        rows.push({
          routeFile,
          method: "GET",
          path,
          durationSec: DURATION,
          connections: CONNECTIONS,
          totalRequests: 0,
          success2xx: 0,
          status4xx: 0,
          status5xx: 0,
          status429: 0,
          successPct: 0,
          latencyAvgMs: 0,
          latencyP95Ms: 0,
          reqPerSecAvg: 0,
          throughputBytesPerSec: 0,
          successRpm: 0,
          totalRpm: 0,
          error: run.error,
        });
      } else {
        rows.push(calcRow(routeFile, path, run.payload));
      }
      if (COOLDOWN_MS > 0) {
        await delay(COOLDOWN_MS);
      }
    }
  }

  mkdirSync(join(process.cwd(), "tmp"), { recursive: true });
  writeFileSync(join(process.cwd(), "tmp", "endpoint-performance-matrix.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    baseUrl: FE_BASE,
    profile: {
      method: "GET",
      connections: CONNECTIONS,
      durationSec: DURATION,
      overallRate: OVERALL_RATE,
      role: "owner",
    },
    context,
    rows,
    skipped,
  }, null, 2));
  writeFileSync(join(process.cwd(), "tmp", "endpoint-performance-matrix.md"), toMarkdown(rows, skipped, context));

  const okRows = rows.filter((row) => !row.error);
  const healthy = okRows.filter((row) => row.status5xx === 0);
  const unstable = okRows.filter((row) => row.status5xx > 0 || row.status429 > 0);
  const failed = rows.filter((row) => row.error);

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalRoutes: routeFiles.length,
    measuredGetRoutes: rows.length,
    skippedRoutes: skipped.length,
    healthyRoutes: healthy.length,
    unstableRoutes: unstable.length,
    failedRoutes: failed.length,
    outputJson: "tmp/endpoint-performance-matrix.json",
    outputMarkdown: "tmp/endpoint-performance-matrix.md",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
