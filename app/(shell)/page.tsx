import DoctorSection from '../sections/DoctorSection';
import { requirePageRoute } from '../lib/page-auth';

export default async function Home() {
  await requirePageRoute("doctorHome");
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <DoctorSection />
      </div>
    </div>
  );
}
