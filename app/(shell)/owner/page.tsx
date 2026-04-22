import { redirect } from "next/navigation";
import { requirePageRoute } from '../../lib/page-auth';

export default async function OwnerPage() {
  await requirePageRoute("ownerWorkspace");
  redirect("/create-user");
}
