import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole, type AppRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homeForRole(user.role as AppRole));
}
