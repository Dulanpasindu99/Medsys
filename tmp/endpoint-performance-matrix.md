# Endpoint Performance Matrix

- Generated at: 2026-04-29T03:05:02.883Z
- Base URL: http://localhost:3000
- Benchmark profile: GET, connections=2, overallRate=2 req/s, duration=3s per endpoint
- Endpoint cooldown: 0ms
- Auth role used: owner (owner@medsys.local)

## Measured GET Endpoints

| Endpoint | 2xx % | 2xx | 4xx | 5xx | 429 | Avg Latency (ms) | P95 (ms) | Success RPM | Total RPM |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/api/analytics/dashboard` | 100 | 6/6 | 0 | 0 | 0 | 99.68 | 258 | 120 | 120 |
| `/api/analytics/overview` | 100 | 6/6 | 0 | 0 | 0 | 56.4 | 117 | 120 | 120 |
| `/api/appointments/doctors` | 100 | 6/6 | 0 | 0 | 0 | 62.73 | 169 | 120 | 120 |
| `/api/appointments?status=waiting` | 100 | 6/6 | 0 | 0 | 0 | 210.77 | 507 | 120 | 120 |
| `/api/audit/logs` | 100 | 6/6 | 0 | 0 | 0 | 44.03 | 100 | 120 | 120 |
| `/api/auth/me` | 100 | 6/6 | 0 | 0 | 0 | 65.29 | 166 | 120 | 120 |
| `/api/auth/status` | 100 | 6/6 | 0 | 0 | 0 | 33.05 | 91 | 120 | 120 |
| `/api/backend/v1/auth/status` | 100 | 6/6 | 0 | 0 | 0 | 25.63 | 63 | 120 | 120 |
| `/api/clinical/diagnoses/A00/recommended-tests` | 100 | 6/6 | 0 | 0 | 0 | 28.72 | 61 | 120 | 120 |
| `/api/clinical/diagnoses?terms=a&limit=5` | 100 | 6/6 | 0 | 0 | 0 | 15.86 | 38 | 120 | 120 |
| `/api/clinical/icd10?terms=a&limit=5` | 100 | 6/6 | 0 | 0 | 0 | 13.49 | 32 | 120 | 120 |
| `/api/clinical/tests?terms=a&limit=5` | 100 | 6/6 | 0 | 0 | 0 | 16.26 | 36 | 120 | 120 |
| `/api/encounters/71` | 100 | 6/6 | 0 | 0 | 0 | 63.75 | 138 | 120 | 120 |
| `/api/encounters` | 100 | 6/6 | 0 | 0 | 0 | 29.64 | 66 | 120 | 120 |
| `/api/families` | 100 | 6/6 | 0 | 0 | 0 | 25.56 | 56 | 120 | 120 |
| `/api/inventory/12/batches` | 100 | 6/6 | 0 | 0 | 0 | 34.58 | 76 | 120 | 120 |
| `/api/inventory/12/movements` | 100 | 6/6 | 0 | 0 | 0 | 47.23 | 111 | 120 | 120 |
| `/api/inventory/12` | 100 | 6/6 | 0 | 0 | 0 | 35.36 | 80 | 120 | 120 |
| `/api/inventory/alerts?days=30` | 100 | 6/6 | 0 | 0 | 0 | 27.01 | 62 | 120 | 120 |
| `/api/inventory/reports?days=30` | 100 | 6/6 | 0 | 0 | 0 | 53.56 | 154 | 120 | 120 |
| `/api/inventory` | 100 | 6/6 | 0 | 0 | 0 | 21.36 | 45 | 120 | 120 |
| `/api/inventory/search?q=ab&limit=5` | 100 | 6/6 | 0 | 0 | 0 | 23.27 | 56 | 120 | 120 |
| `/api/patients/51/allergies` | 100 | 6/6 | 0 | 0 | 0 | 29.27 | 62 | 120 | 120 |
| `/api/patients/51/conditions` | 100 | 6/6 | 0 | 0 | 0 | 34.2 | 73 | 120 | 120 |
| `/api/patients/51/consultations` | 100 | 6/6 | 0 | 0 | 0 | 35.42 | 72 | 120 | 120 |
| `/api/patients/51/family` | 100 | 6/6 | 0 | 0 | 0 | 41.96 | 100 | 120 | 120 |
| `/api/patients/51/history` | 100 | 6/6 | 0 | 0 | 0 | 38.22 | 85 | 120 | 120 |
| `/api/patients/51/profile` | 100 | 6/6 | 0 | 0 | 0 | 36 | 86 | 120 | 120 |
| `/api/patients/51` | 100 | 6/6 | 0 | 0 | 0 | 36.67 | 75 | 120 | 120 |
| `/api/patients/51/timeline` | 100 | 6/6 | 0 | 0 | 0 | 30.58 | 63 | 120 | 120 |
| `/api/patients/51/vitals` | 100 | 6/6 | 0 | 0 | 0 | 46.12 | 118 | 120 | 120 |
| `/api/patients` | 100 | 6/6 | 0 | 0 | 0 | 42.18 | 108 | 120 | 120 |
| `/api/prescriptions/1` | 100 | 6/6 | 0 | 0 | 0 | 33.62 | 80 | 120 | 120 |
| `/api/prescriptions/queue/pending-dispense` | 100 | 6/6 | 0 | 0 | 0 | 32.91 | 80 | 120 | 120 |
| `/api/reports/clinic-overview?range=30d` | 100 | 6/6 | 0 | 0 | 0 | 57.1 | 164 | 120 | 120 |
| `/api/reports/doctor-performance?range=30d` | 100 | 6/6 | 0 | 0 | 0 | 38.21 | 91 | 120 | 120 |
| `/api/reports/assistant-performance?range=30d` | 100 | 6/6 | 0 | 0 | 0 | 49.91 | 109 | 120 | 120 |
| `/api/reports/inventory-usage?range=30d` | 100 | 6/6 | 0 | 0 | 0 | 56.92 | 121 | 120 | 120 |
| `/api/reports/patient-followup?range=30d` | 100 | 6/6 | 0 | 0 | 0 | 34.33 | 73 | 120 | 120 |
| `/api/reports/daily-summary/history?limit=10` | 100 | 6/6 | 0 | 0 | 0 | 35.72 | 91 | 120 | 120 |
| `/api/reports/daily-summary` | 100 | 6/6 | 0 | 0 | 0 | 40.5 | 87 | 120 | 120 |
| `/api/tasks` | 100 | 6/6 | 0 | 0 | 0 | 23.7 | 59 | 120 | 120 |
| `/api/users` | 100 | 6/6 | 0 | 0 | 0 | 19.53 | 39 | 120 | 120 |

## Skipped Routes

| Route file | Reason |
|---|---|
| `app/api/appointments/[id]/route.ts` | No GET method (PATCH) |
| `app/api/auth/active-role/route.ts` | No GET method (POST) |
| `app/api/auth/login/route.ts` | No GET method (POST) |
| `app/api/auth/logout/route.ts` | No GET method (POST) |
| `app/api/auth/register/route.ts` | No GET method (POST) |
| `app/api/consultations/save/route.ts` | No GET method (POST) |
| `app/api/inventory/[id]/adjust-stock/route.ts` | No GET method (POST) |
| `app/api/prescriptions/[id]/dispense/route.ts` | No GET method (POST) |
| `app/api/tasks/[id]/complete/route.ts` | No GET method (POST) |
| `app/api/tasks/[id]/route.ts` | No GET method (PATCH) |
| `app/api/users/[id]/route.ts` | No GET method (PATCH) |
| `app/api/visits/start/route.ts` | No GET method (POST) |

## Probe Context

```json
{
  "patientId": 51,
  "encounterId": 71,
  "appointmentId": 78,
  "inventoryId": 12,
  "taskId": 1,
  "userId": 20,
  "diagnosisCode": "A00"
}
```
