import PatientSection from '../sections/PatientSection';
import { requirePageSession } from '../lib/page-auth';

export default async function PatientPage() {
    await requirePageSession(['owner', 'doctor', 'assistant']);

    return (
        <div className="h-full w-full">
            <div className="page-width mx-auto">
                <PatientSection />
            </div>
        </div>
    );
}
