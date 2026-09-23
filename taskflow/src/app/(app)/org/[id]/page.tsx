import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";
import { CreateProjectForm } from "@/components/create-project-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", id)
    .single();

  return { title: org?.name ?? "Organization" };
}

export default async function OrgPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: org, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !org) {
    notFound();
  }

  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", id)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const myRole = myMembership?.role ?? "member";

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", id)
    .order("created_at", { ascending: false });

  const { data: memberRows } = await supabase
    .from("organization_members")
    .select(
      "user_id, role, profile:profiles(id, full_name, created_at)"
    )
    .eq("organization_id", id)
    .order("created_at", { ascending: true });

  const members = (memberRows ?? []) as unknown as {
    user_id: string;
    role: string;
    profile: Profile | null;
  }[];

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
            {org.description && (
              <p className="mt-1 text-sm text-gray-600">{org.description}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Your role: <span className="font-medium">{myRole}</span>
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-xs font-medium text-gray-500">Invite code</p>
            <p className="mt-1 text-lg font-bold tracking-widest text-indigo-600 uppercase">
              {org.invite_code}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Projects
          </h2>
          {projects && projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
                      {project.name}
                    </h3>
                  </div>
                  {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {project.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-600">
                No projects yet. Create the first one.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <CreateProjectForm organizationId={id} />

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              Members ({members?.length ?? 0})
            </h2>
            <ul className="space-y-3">
              {members?.map((member) => (
                <li key={member.user_id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {(member.profile?.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {member.profile?.full_name || "Unknown user"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.role === "owner"
                        ? "bg-indigo-100 text-indigo-700"
                        : member.role === "admin"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}