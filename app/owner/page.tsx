import OwnerSection from '../sections/OwnerSection';
import { requirePageSession } from '../lib/page-auth';

export default async function OwnerPage() {
    await requirePageSession(['owner']);

    return (
        <div className="h-full w-full">
            <div className="page-width mx-auto">
                <OwnerSection />
            </div>
        </div>
    );
}
