import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "@/components/create-org-form";
import { JoinOrgForm } from "@/components/join-org-form";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, description, invite_code, created_at")
    .order("created_at", { ascending: false });

  const { data: memberCounts } = await supabase
    .from("organization_members")
    .select("organization_id")
    .order("organization_id");

  const { data: projectRows } = await supabase
    .from("projects")
    .select("organization_id, id");

  const memberCountsByOrg = new Map<string, number>();
  memberCounts?.forEach((row) => {
    memberCountsByOrg.set(
      row.organization_id,
      (memberCountsByOrg.get(row.organization_id) ?? 0) + 1
    );
  });

  const projectCountsByOrg = new Map<string, number>();
  projectRows?.forEach((row) => {
    projectCountsByOrg.set(
      row.organization_id,
      (projectCountsByOrg.get(row.organization_id) ?? 0) + 1
    );
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your organizations, projects, and tasks in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Your organizations
          </h2>

          {orgs && orgs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {orgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/org/${org.id}`}
                  className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
                >
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
                    {org.name}
                  </h3>
                  {org.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {org.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-gray-500">
                    {memberCountsByOrg.get(org.id) ?? 0} members ·{" "}
                    {projectCountsByOrg.get(org.id) ?? 0} projects
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-600">
                You are not part of any organization yet.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Create one or join with an invite code.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <CreateOrgForm />
          <JoinOrgForm />
        </aside>
      </div>
    </div>
  );
}