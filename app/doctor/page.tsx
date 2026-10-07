import { requirePageUser } from "@/lib/auth";
import { DoctorDashboard } from "@/components/DoctorDashboard";

export const dynamic = "force-dynamic";

export default async function DoctorPage() {
  await requirePageUser(["DOCTOR"]);
  return <DoctorDashboard />;
}
