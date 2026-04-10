import DailySummaryReportsSection from '../../../sections/DailySummaryReportsSection';
import { requirePageRoute } from '../../../lib/page-auth';

export default async function DailySummaryPage() {
  await requirePageRoute("analyticsOverview");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <DailySummaryReportsSection
        initialWorkspaceMode="dashboard"
        hideViewMode
      />
    </div>
  );
}
