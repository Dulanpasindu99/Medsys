import OwnerSection from '../../sections/OwnerSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function OwnerPage() {
  await requirePageRoute("ownerWorkspace");
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <OwnerSection />
      </div>
    </div>
  );
}
