import InventorySection from '../../sections/InventorySection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function InventoryPage() {
  await requirePageRoute("inventoryBoard");
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <InventorySection />
      </div>
    </div>
  );
}
