import AnalyticsSection from '../../sections/AnalyticsSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function AnalyticsPage() {
  await requirePageRoute("analyticsOverview");
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <AnalyticsSection />
      </div>
    </div>
  );
}
