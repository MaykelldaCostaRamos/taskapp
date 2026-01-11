import { useDraggable } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import { CSS } from '@dnd-kit/utilities';

export default function KanbanTaskCard({ task, projectId, canEdit, isOwner, isDragging = false }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task._id,
    disabled: !canEdit,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 border-gray-300',
    medium: 'bg-orange-100 text-orange-700 border-orange-300',
    high: 'bg-red-100 text-red-700 border-red-300',
  };

  const priorityIcons = {
    low: '↓',
    medium: '→',
    high: '↑',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl
        transition-all duration-200 cursor-grab active:cursor-grabbing
        border-l-4 ${
          task.priority === 'high' ? 'border-red-500' :
          task.priority === 'medium' ? 'border-orange-500' :
          'border-gray-300'
        }
        ${isDragging ? 'opacity-50 rotate-3' : ''}
        ${!canEdit ? 'cursor-default' : ''}
      `}
    >
      <div className="p-4">
        {/* Título */}
        <Link
          to={`/projects/${projectId}/tasks/${task._id}`}
          className="block group"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {task.title}
          </h3>
        </Link>

        {/* Descripción */}
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Prioridad */}
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium border
            ${priorityColors[task.priority]}
          `}>
            <span className="mr-1">{priorityIcons[task.priority]}</span>
            {task.priority}
          </span>

          {/* Fecha límite */}
          {task.dueDate && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
              📅 {new Date(task.dueDate).toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </span>
          )}
        </div>

        {/* Asignados */}
        {task.assignedTo && task.assignedTo.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {task.assignedTo.slice(0, 3).map((user, index) => (
                <div
                  key={user._id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-700 shadow"
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.assignedTo.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold border-2 border-white dark:border-gray-700">
                  +{task.assignedTo.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      {canEdit && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex justify-between items-center border-t border-gray-100 dark:border-gray-600">
          <Link
            to={`/projects/${projectId}/tasks/${task._id}/edit`}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            ✏️ Editar
          </Link>
          
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(task.createdAt).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
        </div>
      )}
    </div>
  );
}