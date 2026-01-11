import { useDroppable } from '@dnd-kit/core';
import KanbanTaskCard from './KanbanTaskCard';

export default function KanbanColumn({ id, title, color, tasks, projectId, canEdit, isOwner }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header de la columna */}
      <div className={`${color} text-white px-4 py-3 rounded-t-lg font-semibold flex items-center justify-between shadow-md`}>
        <span className="text-lg">{title}</span>
        <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-bold">
          {tasks.length}
        </span>
      </div>

      {/* Zona de drop */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 bg-gray-50 dark:bg-gray-800 rounded-b-lg p-4 min-h-[500px]
          transition-all duration-200
          ${isOver ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-400' : ''}
        `}
      >
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              <svg
                className="mx-auto h-12 w-12 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm">No hay tareas</p>
            </div>
          ) : (
            tasks.map(task => (
              <KanbanTaskCard
                key={task._id}
                task={task}
                projectId={projectId}
                canEdit={canEdit}
                isOwner={isOwner}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}