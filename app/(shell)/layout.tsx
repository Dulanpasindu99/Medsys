import { redirect } from "next/navigation";
import NavigationPanel from "../components/NavigationPanel";
import { PageTransition } from "../components/PageTransition";
import { getBackendAvailability } from "../lib/backend-health";
import { requirePageSession } from "../lib/page-auth";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageSession();
  const backend = await getBackendAvailability();

  if (!backend.ok) {
    redirect(
      `/system/unavailable?reason=${encodeURIComponent(backend.reason)}`
    );
  }

  return (
    <div className="flex h-dvh min-h-dvh w-full overflow-hidden bg-slate-50">
      <NavigationPanel
        sessionRole={session.role}
        sessionPermissions={session.permissions}
        userName={session.name}
      />
      <main className="min-w-0 flex-1 overflow-hidden pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-3 md:pb-4 md:pl-[7rem] md:pt-4 lg:pl-[8.5rem]">
        <div className="page-width h-full min-h-0">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
