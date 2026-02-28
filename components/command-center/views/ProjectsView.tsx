'use client';

import { motion } from 'framer-motion';
import { Folder, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useProjects, useTasks } from '@/lib/hooks';

const statusIcon: Record<string, any> = {
  done: CheckCircle2,
  active: Clock,
  completed: CheckCircle2,
  todo: AlertCircle,
  in_progress: Clock,
};

const statusColor: Record<string, string> = {
  done: 'text-green-400 border-green-400/30 bg-green-400/10',
  active: 'text-neon border-neon/30 bg-neon/10',
  completed: 'text-green-400 border-green-400/30 bg-green-400/10',
  todo: 'text-white/40 border-white/10 bg-white/5',
  in_progress: 'text-gold border-gold/30 bg-gold/10',
};

export default function ProjectsView() {
  const { data: projects, loading: pLoading } = useProjects();
  const { data: tasks, loading: tLoading } = useTasks();

  if (pLoading || tLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Folder className="h-5 w-5 text-neon/60" />
        <h2 className="font-mono text-lg font-medium text-white/80">Projects & Tasks</h2>
        <span className="font-mono text-xs text-white/30 ml-2">{projects.length} projects, {tasks.length} tasks</span>
      </div>

      {projects.map((project: any, pi: number) => {
        const projectTasks = tasks.filter((t: any) => t.project_id === project.id);
        const completed = projectTasks.filter((t: any) => (t.status === 'completed' || t.status === 'done')).length;
        const total = projectTasks.length;

        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pi * 0.08 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={"flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono border " + (statusColor[project.status] || statusColor.todo)}>
                {project.status}
              </div>
              <h3 className="font-mono text-sm font-medium text-white/90">{project.name}</h3>
              {total > 0 && (
                <span className="font-mono text-[10px] text-white/30 ml-auto">
                  {completed}/{total} done
                </span>
              )}
            </div>

            {project.description && (
              <p className="font-mono text-xs text-white/40 mb-3">{project.description}</p>
            )}

            {total > 0 && (
              <div className="space-y-1.5">
                <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neon/60 transition-all"
                    style={{ width: total > 0 ? (completed / total * 100) + '%' : '0%' }}
                  />
                </div>
                <div className="space-y-1">
                  {projectTasks.map((task: any) => {
                    const Icon = statusIcon[task.status] || AlertCircle;
                    return (
                      <div key={task.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/[0.03]">
                        <Icon className={"h-3 w-3 " + (task.status === 'completed' ? 'text-green-400' : task.status === 'in_progress' ? 'text-gold' : 'text-white/30')} />
                        <span className={"font-mono text-[11px] " + (task.status === 'completed' ? 'text-white/40 line-through' : 'text-white/70')}>
                          {task.title}
                        </span>
                        {task.assigned_to && (
                          <span className="font-mono text-[9px] text-white/20 ml-auto">{task.assigned_to}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      {projects.length === 0 && (
        <div className="text-center font-mono text-xs text-white/30 py-16">
          No projects yet. They'll appear here as agents create them.
        </div>
      )}
    </div>
  );
}
