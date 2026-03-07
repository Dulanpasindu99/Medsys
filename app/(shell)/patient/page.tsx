import PatientSection from '../../sections/PatientSection';

export default async function PatientPage() {
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <PatientSection />
      </div>
    </div>
  );
}
