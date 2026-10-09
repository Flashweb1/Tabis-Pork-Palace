import { redirect } from "next/navigation";

export default function DealsPage() {
  redirect("/shop?deals=1");
}
