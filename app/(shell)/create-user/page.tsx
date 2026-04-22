import OwnerSection from '../../sections/OwnerSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function CreateUserPage() {
  await requirePageRoute("ownerWorkspace");
  return (
    <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden">
      <div className="page-width mx-auto flex h-full min-h-0 w-full flex-1 flex-col">
        <OwnerSection />
      </div>
    </div>
  );
}
