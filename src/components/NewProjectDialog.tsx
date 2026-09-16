"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  createProjectAction,
  type ProjectActionState,
} from "@/app/(app)/projects/actions";

const initialState: ProjectActionState = { error: null };

export function NewProjectDialog({
  triggerClassName = "pp-btn pp-btn-primary",
  triggerLabel = "+ New Project",
}: {
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="pp-card w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                New project
              </h2>
              <button
                className="text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              {state.error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {state.error}
                </div>
              )}
              <div>
                <label className="pp-label" htmlFor="name">
                  Project name *
                </label>
                <input
                  id="name"
                  name="name"
                  className="pp-input"
                  required
                  placeholder="Johnson Residence"
                />
              </div>
              <div>
                <label className="pp-label" htmlFor="clientName">
                  Client name
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  className="pp-input"
                  placeholder="Mr. & Mrs. Johnson"
                />
              </div>
              <div>
                <label className="pp-label" htmlFor="address">
                  Project address
                </label>
                <input
                  id="address"
                  name="address"
                  className="pp-input"
                  placeholder="1420 Maple Ave, Austin, TX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="pp-label" htmlFor="startDate">
                    Start date
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    className="pp-input"
                  />
                </div>
                <div>
                  <label className="pp-label" htmlFor="targetEndDate">
                    Expected completion
                  </label>
                  <input
                    id="targetEndDate"
                    name="targetEndDate"
                    type="date"
                    className="pp-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="pp-btn pp-btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pp-btn pp-btn-primary disabled:opacity-60"
                  disabled={pending}
                >
                  {pending ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
