import DoctorSection from '../sections/DoctorSection';

export default async function Home() {
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <DoctorSection />
      </div>
    </div>
  );
}
