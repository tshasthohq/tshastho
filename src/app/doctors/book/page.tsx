import { redirect } from "next/navigation";

export default async function BookRedirect({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  redirect(id ? `/doctors/${id}#slots` : "/doctors");
}
