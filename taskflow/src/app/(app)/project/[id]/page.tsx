import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Task } from "@/lib/database.types";
import { TaskBoard } from "@/components/task-board";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .single();

  return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, assignee:profiles(id, full_name, created_at)")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("profile:profiles(id, full_name, created_at)")
    .eq("organization_id", project.organization_id);

  const members: Profile[] = Array.from(
    new Map(
      (memberRows ?? [])
        .map((row) => (row as unknown as { profile: Profile }).profile)
        .filter((p): p is Profile => Boolean(p))
        .map((p) => [p.id, p])
    ).values()
  );

  return (
    <TaskBoard
      projectId={project.id}
      projectName={project.name}
      color={project.color}
      initialTasks={(tasks ?? []) as Task[]}
      members={members}
      currentUserId={user.id}
    />
  );
}