import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-xl font-semibold text-gray-900">
        Welcome back
      </h1>
      <AuthForm mode="login" />
    </>
  );
}