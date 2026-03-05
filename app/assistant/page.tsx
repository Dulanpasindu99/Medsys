import AssistantSection from '../sections/AssistantSection';
import { requirePageSession } from '../lib/page-auth';

export default async function AssistantPage() {
    await requirePageSession(['owner', 'assistant']);

    return (
        <div className="h-full w-full">
            <div className="page-width mx-auto">
                <AssistantSection />
            </div>
        </div>
    );
}
