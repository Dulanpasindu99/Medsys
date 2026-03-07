import { redirect } from "next/navigation";
import NavigationPanel from "../components/NavigationPanel";
import { PageTransition } from "../components/PageTransition";
import { getBackendAvailability } from "../lib/backend-health";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const backend = await getBackendAvailability();

  if (!backend.ok) {
    redirect(
      `/system/unavailable?reason=${encodeURIComponent(backend.reason)}`
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F4F9]">
      <NavigationPanel />
      <main className="flex-1 overflow-y-auto pl-[96px] lg:pl-[130px]">
        <div className="page-width">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
