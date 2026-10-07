import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReceptionDashboard } from "@/components/ReceptionDashboard";

export const dynamic = "force-dynamic";

export default async function ReceptionPage() {
  await requirePageUser(["RECEPTION"]);
  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return <ReceptionDashboard initialPatients={patients} />;
}
