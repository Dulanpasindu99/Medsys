import DailySummaryReportsSection from '../../../sections/DailySummaryReportsSection';
import { requirePageRoute } from '../../../lib/page-auth';

export default async function DoctorPerformancePage() {
  await requirePageRoute("analyticsOverview");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <DailySummaryReportsSection
        initialWorkspaceMode="reports"
        initialReportType="doctor-performance"
        hideViewMode
      />
    </div>
  );
}
