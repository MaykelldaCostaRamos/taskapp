import { useState } from 'react';
import TaskCard from './TaskCard';
import axios from '../api/axios';
import { getErrorMessage } from '../utils/errorHandler';

export default function TaskList({ tasks, projectId, canEdit, isOwner, onUpdate }) {
  const [error, setError] = useState(null);

  const handleToggleStatus = async (taskId) => {
    setError(null);

    try {
      await axios.patch(`/projects/tasks/${taskId}/toggle`);
      onUpdate();
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('¿Eliminar esta tarea?')) {
      return;
    }

    setError(null);

    try {
      await axios.delete(`/projects/tasks/${taskId}`);
      onUpdate();
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    }
  };

  if (tasks.length === 0) {
    return <p>No hay tareas en este proyecto.</p>;
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {tasks.map(task => (
        <TaskCard
          key={task._id}
          task={task}
          projectId={projectId}
          canEdit={canEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={isOwner ? handleDelete : null}
        />
      ))}
    </div>
  );
}