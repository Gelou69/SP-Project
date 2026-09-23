import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-sm font-medium text-indigo-700">
        Midterm Project — Next.js 16 + Self-hosted Supabase
      </div>
      <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Plan, assign, and ship together with{" "}
        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          TaskFlow
        </span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-gray-600">
        A full-stack task &amp; project manager. Organizations, projects,
        kanban-style boards, comments, row-level security, and realtime updates
        — all backed by a Supabase stack you host yourself.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Create account
        </Link>
      </div>
      <p className="mt-8 text-sm text-gray-500">
        Demo accounts: alice@taskflow.local /{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5">alice123</code>
      </p>
    </main>
  );
}