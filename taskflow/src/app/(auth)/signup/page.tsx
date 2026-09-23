import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-xl font-semibold text-gray-900">
        Create your account
      </h1>
      <AuthForm mode="signup" />
    </>
  );
}