"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  Profile,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/database.types";
import { TaskDetailModal } from "@/components/task-detail-modal";

const COLUMNS: {
  status: TaskStatus;
  label: string;
  dot: string;
}[] = [
  { status: "todo", label: "To Do", dot: "bg-gray-400" },
  { status: "in_progress", label: "In Progress", dot: "bg-amber-500" },
  { status: "done", label: "Done", dot: "bg-emerald-500" },
];

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

function emptyForm(): {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  due_date: string;
} {
  return {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee_id: "",
    due_date: "",
  };
}

export function TaskBoard({
  projectId,
  projectName,
  color,
  initialTasks,
  members,
  currentUserId,
}: {
  projectId: string;
  projectName: string;
  color: string;
  initialTasks: Task[];
  members: Profile[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<Task>) => {
          setTasks((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Task;
              return prev.some((t) => t.id === row.id)
                ? prev
                : [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Task;
              return prev.map((t) =>
                t.id === row.id
                  ? {
                      ...t,
                      ...row,
                      assignee:
                        row.assignee_id === t.assignee_id
                          ? t.assignee
                          : (members.find((m) => m.id === row.assignee_id) ??
                            null),
                    }
                  : t
              );
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as { id: string };
              return prev.filter((t) => t.id !== old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase, members]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          assignee_id: form.assignee_id || null,
          due_date: form.due_date || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Normalize into a Task with assignee for the local list
      const assignee = members.find((m) => m.id === data.assignee_id) ?? null;
      setTasks((prev) =>
        prev.some((t) => t.id === data.id)
          ? prev
          : [{ ...data, assignee }, ...prev]
      );
      setShowCreate(false);
      setForm(emptyForm());
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create task");
    } finally {
      setCreating(false);
    }
  }

  async function moveTask(task: Task, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status } : t))
    );
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", task.id);
    if (error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    }
  }

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    tasks.forEach((task) => {
      if (task.status in map) map[task.status as TaskStatus].push(task);
    });
    return map;
  }, [tasks]);

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
            <p className="text-sm text-gray-600">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} · realtime on
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          + New task
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <section
            key={col.status}
            className="rounded-xl bg-gray-100 p-3"
          >
            <header className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
              <h2 className="text-sm font-semibold text-gray-700">
                {col.label}
              </h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500">
                {byStatus[col.status].length}
              </span>
            </header>

            <div className="space-y-3">
              {byStatus[col.status].map((task) => (
                <article
                  key={task.id}
                  onClick={() => setOpenTaskId(task.id)}
                  className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow"
                >
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="text-[10px] text-gray-500">
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.assignee && (
                        <span
                          title={task.assignee.full_name}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700"
                        >
                          {task.assignee.full_name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex gap-1 opacity-0 transition group-hover:opacity-100"
                      >
                        {col.status !== "todo" && (
                          <button
                            onClick={() => moveTask(task, "todo")}
                            title="Move to To Do"
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs hover:bg-gray-200"
                          >
                            ⟵
                          </button>
                        )}
                        {col.status === "todo" && (
                          <button
                            onClick={() => moveTask(task, "in_progress")}
                            title="Start task"
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs hover:bg-gray-200"
                          >
                            →
                          </button>
                        )}
                        {col.status === "done" && (
                          <button
                            onClick={() => moveTask(task, "in_progress")}
                            title="Reopen task"
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs hover:bg-gray-200"
                          >
                            ⟶
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {byStatus[col.status].length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                  Empty
                </p>
              )}
            </div>
          </section>
        ))}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowCreate(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={createTask}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-gray-900">New task</h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as TaskStatus })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.status} value={c.status}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value as TaskPriority })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Assignee
                </label>
                <select
                  value={form.assignee_id}
                  onChange={(e) =>
                    setForm({ ...form, assignee_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Due date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm({ ...form, due_date: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {createError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {createError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {openTask && (
        <TaskDetailModal
          task={openTask}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setOpenTaskId(null)}
          onUpdate={(updated) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
          }}
          onDelete={(taskId) => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            setOpenTaskId(null);
          }}
        />
      )}
    </div>
  );
}