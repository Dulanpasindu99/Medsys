import EndpointHealthChecklistSection from '../../../sections/EndpointHealthChecklistSection';
import { requirePageRoute } from '../../../lib/page-auth';

export default async function EndpointHealthPage() {
  await requirePageRoute("analyticsOverview");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <EndpointHealthChecklistSection />
    </div>
  );
}
