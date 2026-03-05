import InventorySection from '../sections/InventorySection';
import { requirePageSession } from '../lib/page-auth';

export default async function InventoryPage() {
    await requirePageSession(['owner', 'doctor', 'assistant']);

    return (
        <div className="h-full w-full">
            <div className="page-width mx-auto">
                <InventorySection />
            </div>
        </div>
    );
}
