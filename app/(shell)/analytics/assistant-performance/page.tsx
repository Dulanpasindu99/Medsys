import DailySummaryReportsSection from '../../../sections/DailySummaryReportsSection';
import { requirePageRoute } from '../../../lib/page-auth';

export default async function AssistantPerformancePage() {
  await requirePageRoute("analyticsOverview");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <DailySummaryReportsSection
        initialWorkspaceMode="reports"
        initialReportType="assistant-performance"
        hideViewMode
      />
    </div>
  );
}
