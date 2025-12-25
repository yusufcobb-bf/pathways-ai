import AuthForm from "@/components/AuthForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const role = params.role === "educator" ? "educator" : "student";
  return <AuthForm mode="signup" role={role} />;
}
