import AnalyticsSection from '../../sections/AnalyticsSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function AnalyticsPage() {
  await requirePageRoute("analyticsOverview");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <AnalyticsSection />
    </div>
  );
}
