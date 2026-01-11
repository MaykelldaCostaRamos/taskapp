import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColum';
import KanbanTaskCard from './KanbanTaskCard';
import axios from '../api/axios';
import { getErrorMessage } from '../utils/errorHandler';

export default function KanbanBoard({ tasks, projectId, canEdit, isOwner, onUpdate }) {
  const [activeTask, setActiveTask] = useState(null);
  const [error, setError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Agrupar tareas por estado
  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  const columns = [
    { id: 'pending', title: 'Pendiente', color: 'bg-yellow-500' },
    { id: 'in-progress', title: 'En Progreso', color: 'bg-blue-500' },
    { id: 'completed', title: 'Completado', color: 'bg-green-500' },
  ];

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Actualizar estado en el backend
    try {
      await axios.put(`/projects/tasks/${taskId}`, {
        status: newStatus,
      });
      onUpdate();
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={tasksByStatus[column.id]}
              projectId={projectId}
              canEdit={canEdit}
              isOwner={isOwner}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-80">
              <KanbanTaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}