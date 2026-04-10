import AiSection from '../../sections/AiSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function AiPage() {
  await requirePageRoute("aiWorkspace");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="page-width mx-auto flex h-full min-h-0 flex-1 flex-col">
        <AiSection />
      </div>
    </div>
  );
}
