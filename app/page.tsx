import DoctorSection from './sections/DoctorSection';
import { requirePageSession } from './lib/page-auth';

export default async function Home() {
  await requirePageSession(['owner', 'doctor']);

  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <DoctorSection />
      </div>
    </div>
  );
}

