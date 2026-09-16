import { getProjectSummaries } from "@/lib/projects";
import { PageHeader, EmptyState } from "@/components/ui";
import { ProjectCard } from "@/components/ProjectCard";
import { NewProjectDialog } from "@/components/NewProjectDialog";

export default async function ProjectsPage() {
  const projects = await getProjectSummaries();

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="All of your construction projects"
        actions={<NewProjectDialog />}
      />
      <div className="p-8">
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to get started."
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
