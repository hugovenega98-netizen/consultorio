import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";

export default async function PatientsPage() {
  await requirePageUser(["RECEPTION", "ADMIN"]);
  redirect("/reception");
}
