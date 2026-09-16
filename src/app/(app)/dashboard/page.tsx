import { getProjectSummaries } from "@/lib/projects";
import { PageHeader, EmptyState } from "@/components/ui";
import { ProjectCard } from "@/components/ProjectCard";
import { NewProjectDialog } from "@/components/NewProjectDialog";

export default async function DashboardPage() {
  const projects = await getProjectSummaries();

  const totalAttention = projects.reduce(
    (sum, p) => sum + p.attentionCount,
    0,
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          projects.length > 0
            ? `${projects.length} active project${projects.length === 1 ? "" : "s"} · ${totalAttention} item${totalAttention === 1 ? "" : "s"} need attention`
            : "Your construction projects at a glance"
        }
        actions={<NewProjectDialog />}
      />

      <div className="p-8">
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project, upload some documents, and ProjectPilot will build a timeline and weekly report from them."
            action={<NewProjectDialog />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
