"use client";

import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  Profile,
  Task,
  TaskComment,
  TaskPriority,
  TaskStatus,
} from "@/lib/database.types";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export function TaskDetailModal({
  task,
  members,
  currentUserId,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: Task;
  members: Profile[];
  currentUserId: string;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  const supabase = createClient();
  const [draft, setDraft] = useState<Task>(task);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    const commentsChannel = supabase
      .channel(`task-comments-${task.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${task.id}`,
        },
        (payload: RealtimePostgresChangesPayload<TaskComment>) => {
          const row = payload.new as TaskComment;
          const author = members.find((m) => m.id === row.author_id) ?? null;
          setComments((prev) => {
            const fixed = prev.map((c) =>
              c.id === row.id ? { ...c, author } : c
            );
            return fixed.some((c) => c.id === row.id)
              ? fixed
              : [...fixed, { ...row, author }];
          });
        }
      )
      .subscribe();

    supabase
      .from("task_comments")
      .select("*, author:profiles(id, full_name, created_at)")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setComments(data as TaskComment[]);
      });

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [supabase, task.id, members]);

  async function patch(payload: Partial<Task>, field: string) {
    setSaving(field);
    // optimistic update so the board feels instant
    onUpdate({ ...draft, ...payload });
    setDraft((d) => ({ ...d, ...payload }));
    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", task.id)
      .select()
      .single();
    setSaving(null);
    if (error || !data) {
      onUpdate(draft);
      setDraft(task);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setCommenting(true);
    setCommentError(null);

    try {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({ task_id: task.id, author_id: currentUserId, body })
        .select("*, author:profiles(id, full_name, created_at)")
        .single();
      if (error) throw error;
      setComments((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [...prev, data as TaskComment]
      );
      setBody("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "Could not post comment"
      );
    } finally {
      setCommenting(false);
    }
  }

  async function removeComment(id: string) {
    await supabase.from("task_comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function removeTask() {
    if (!confirm("Delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (!error) onDelete(task.id);
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[draft.priority]}`}
              >
                {draft.priority}
              </span>
              <button
                onClick={() =>
                  patch(
                    { status: draft.status === "done" ? "in_progress" : "done" },
                    "status"
                  )
                }
                title="Toggle status"
                className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-200"
              >
                {STATUS_LABELS[draft.status]}
              </button>
              {task.due_date && (
                <span className="text-xs text-gray-500">
                  Due {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {task.description ? (
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {task.description}
            </p>
          ) : (
            <p className="text-sm italic text-gray-400">No description.</p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Status
              </label>
              <select
                value={draft.status}
                onChange={(e) =>
                  patch(
                    { status: e.target.value as TaskStatus },
                    "status"
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Priority
              </label>
              <select
                value={draft.priority}
                onChange={(e) =>
                  patch(
                    { priority: e.target.value as TaskPriority },
                    "priority"
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Assignee
              </label>
              <select
                value={draft.assignee_id ?? ""}
                onChange={(e) =>
                  patch(
                    { assignee_id: e.target.value || null },
                    "assignee"
                  )
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
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Due date
            </label>
            <input
              type="date"
              value={draft.due_date ?? ""}
              onChange={(e) =>
                patch({ due_date: e.target.value || null }, "due_date")
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Comments */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Comments ({comments.length})
            </h3>
            <ul className="space-y-3">
              {comments.map((comment) => (
                <li key={comment.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {(comment.author?.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900">
                        {comment.author?.full_name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-400">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                        {comment.author_id === currentUserId && (
                          <button
                            onClick={() => removeComment(comment.id)}
                            className="text-[10px] text-gray-400 hover:text-red-500"
                          >
                            delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700">
                      {comment.body}
                    </p>
                  </div>
                </li>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-gray-400">
                  No comments yet. Start the conversation.
                </p>
              )}
            </ul>

            <form onSubmit={addComment} className="mt-3">
              <textarea
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a comment…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              {commentError && (
                <p className="mt-1 text-xs text-red-600">{commentError}</p>
              )}
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={commenting || !body.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {commenting ? "Posting…" : "Post comment"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <button
            onClick={removeTask}
            className="text-sm font-medium text-red-600 transition hover:text-red-700"
          >
            Delete task
          </button>
          {saving && (
            <span className="text-xs text-gray-400">
              Saving {saving}…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}