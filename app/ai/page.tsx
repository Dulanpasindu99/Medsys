import AiSection from '../sections/AiSection';
import { requirePageSession } from '../lib/page-auth';

export default async function AiPage() {
    await requirePageSession(['owner', 'doctor', 'assistant']);

    return (
        <div className="h-full w-full">
            <div className="page-width mx-auto">
                <AiSection />
            </div>
        </div>
    );
}
