import PatientSection from '../../sections/PatientSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function PatientPage() {
  await requirePageRoute("patientDirectory");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="page-width mx-auto flex h-full min-h-0 flex-1 flex-col">
        <PatientSection />
      </div>
    </div>
  );
}
