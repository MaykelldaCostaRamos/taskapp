import { Link } from 'react-router-dom';

export default function TaskCard({ task, projectId, canEdit, onToggleStatus, onDelete }) {
  const statusColors = {
    pending: '#fbbf24',
    'in-progress': '#3b82f6',
    completed: '#10b981'
  };

  const priorityColors = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#ef4444'
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px'
    }}>
      <div style={{ marginBottom: '8px' }}>
        <Link to={`/projects/${projectId}/tasks/${task._id}`}>
          <h3 style={{ margin: 0 }}>{task.title}</h3>
        </Link>
      </div>

      {task.description && (
        <p style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: statusColors[task.status],
          color: 'white'
        }}>
          {task.status}
        </span>

        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: priorityColors[task.priority],
          color: 'white'
        }}>
          {task.priority}
        </span>

        {task.dueDate && (
          <span style={{ fontSize: '12px', color: '#666' }}>
            Vence: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.assignedTo && task.assignedTo.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '12px' }}>
          <strong>Asignado a:</strong>{' '}
          {task.assignedTo.map(user => user.name).join(', ')}
        </div>
      )}

      {canEdit && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button onClick={() => onToggleStatus(task._id)}>
            {task.status === 'completed' ? 'Marcar Pendiente' : 'Marcar Completada'}
          </button>

          <Link to={`/projects/${projectId}/tasks/${task._id}/edit`}>
            <button>Editar</button>
          </Link>

          {onDelete && (
            <button onClick={() => onDelete(task._id)}>
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}