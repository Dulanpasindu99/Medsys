import AiSection from '../../sections/AiSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function AiPage() {
  await requirePageRoute("aiWorkspace");
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <AiSection />
      </div>
    </div>
  );
}
