import TasksSection from '../../sections/TasksSection';
import { requirePageRoute } from '../../lib/page-auth';

export default async function TasksPage() {
  await requirePageRoute("tasksBoard");
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <TasksSection />
    </div>
  );
}
