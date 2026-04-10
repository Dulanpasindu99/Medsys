import InventorySection from '../../../sections/InventorySection';
import { requirePageRoute } from '../../../lib/page-auth';

export default async function OperationsInventoryPage() {
  await requirePageRoute("inventoryBoard");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <InventorySection />
    </div>
  );
}
