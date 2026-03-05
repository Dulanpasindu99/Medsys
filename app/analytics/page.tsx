import AnalyticsSection from '../sections/AnalyticsSection';
import { requirePageSession } from '../lib/page-auth';

export default async function AnalyticsPage() {
    await requirePageSession(['owner', 'doctor', 'assistant']);

    return (
        <div className="h-full w-full">
            <div className="page-width mx-auto">
                <AnalyticsSection />
            </div>
        </div>
    );
}
