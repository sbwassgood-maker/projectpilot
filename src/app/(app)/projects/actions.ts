"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertProjectOwner } from "@/lib/authz";
import { createProjectSchema } from "@/lib/schemas/project";

export type ProjectActionState = { error: string | null };

export async function createProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const user = await requireUser();

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    clientName: formData.get("clientName") || undefined,
    address: formData.get("address") || undefined,
    startDate: formData.get("startDate") || undefined,
    targetEndDate: formData.get("targetEndDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: data.name,
      clientName: data.clientName ?? null,
      address: data.address ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectStatusAction(
  projectId: string,
  status: string,
): Promise<void> {
  await assertProjectOwner(projectId);
  const allowed = ["planning", "in_progress", "on_hold", "completed"];
  if (!allowed.includes(status)) return;
  await prisma.project.update({
    where: { id: projectId },
    data: { status: status as never },
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}
