import { redirect } from "next/navigation";

export default function CustomerLoginRedirect({ searchParams }) {
  const qs = new URLSearchParams(searchParams).toString();
  redirect(qs ? `/login?${qs}` : "/login");
}
