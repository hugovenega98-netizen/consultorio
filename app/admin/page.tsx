import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const currentUser = await requirePageUser(["ADMIN"]);
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: { id: true, username: true, displayName: true, role: true, active: true },
  });
  return <AdminDashboard initialUsers={users} currentUserId={currentUser.id} />;
}
