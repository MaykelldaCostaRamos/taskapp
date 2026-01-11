import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';

export default function TaskDetail() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const [taskResponse, projectResponse] = await Promise.all([
        axios.get(`/projects/tasks/${taskId}`),
        axios.get(`/projects/${projectId}`)
      ]);

      setTask(taskResponse.data.task);
      setProject(projectResponse.data.project);
      setUserRole(projectResponse.data.userRole);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta tarea?')) {
      return;
    }

    try {
      await axios.delete(`/projects/tasks/${taskId}`);
      navigate(`/projects/${projectId}`);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div>
        <ErrorMessage message={error} />
        <Link to={`/projects/${projectId}`}>
          <button>Volver al Proyecto</button>
        </Link>
      </div>
    );
  }

  const isOwner = userRole === 'owner';
  const canEdit = userRole === 'owner' || userRole === 'editor';

  return (
    <div>
      <h1>{task.title}</h1>

      <Link to={`/projects/${projectId}`}>
        <button>Volver al Proyecto</button>
      </Link>

      {canEdit && (
        <Link to={`/projects/${projectId}/tasks/${taskId}/edit`}>
          <button>Editar Tarea</button>
        </Link>
      )}

      {isOwner && (
        <button onClick={handleDelete}>
          Eliminar Tarea
        </button>
      )}

      <div>
        <h2>Detalles de la Tarea</h2>
        <p><strong>Descripción:</strong> {task.description || 'Sin descripción'}</p>
        <p><strong>Estado:</strong> {task.status}</p>
        <p><strong>Prioridad:</strong> {task.priority}</p>
        
        {task.dueDate && (
          <p><strong>Fecha límite:</strong> {new Date(task.dueDate).toLocaleDateString()}</p>
        )}

        {task.completedAt && (
          <p><strong>Completada el:</strong> {new Date(task.completedAt).toLocaleDateString()}</p>
        )}

        <p><strong>Creada:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
      </div>

      <div>
        <h3>Proyecto</h3>
        <Link to={`/projects/${projectId}`}>
          {project?.name}
        </Link>
      </div>

      <div>
        <h3>Asignado a</h3>
        {task.assignedTo && task.assignedTo.length > 0 ? (
          <ul>
            {task.assignedTo.map(user => (
              <li key={user._id}>
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
        ) : (
          <p>No asignada</p>
        )}
      </div>
    </div>
  );
}