import AssistantSection from '../../sections/AssistantSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function AssistantPage() {
  await requirePageRoute("assistantWorkspace");
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <AssistantSection />
      </div>
    </div>
  );
}
