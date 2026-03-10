import PatientSection from '../../sections/PatientSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function PatientPage() {
  await requirePageRoute("patientDirectory");
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <PatientSection />
      </div>
    </div>
  );
}
