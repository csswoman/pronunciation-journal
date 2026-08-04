import { redirect } from "next/navigation";

export default function IPAPage() {
  redirect("/practice/sounds?openIPA=1");
}
