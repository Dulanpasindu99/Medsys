import DoctorSection from '../sections/DoctorSection';
import { requirePageRoute } from '../lib/page-auth';

export default async function Home() {
  await requirePageRoute("doctorHome");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="page-width mx-auto flex h-full min-h-0 flex-1 flex-col">
        <DoctorSection />
      </div>
    </div>
  );
}
