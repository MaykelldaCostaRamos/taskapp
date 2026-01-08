import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/projects/${id}`);
      setProject(response.data.project);
      setTasks(response.data.tasks);
      setUserRole(response.data.userRole);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await axios.delete(`/projects/${id}`);
      navigate('/projects');
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
        <Link to="/projects">
          <button>Volver a Proyectos</button>
        </Link>
      </div>
    );
  }

  const isOwner = userRole === 'owner';
  const canEdit = userRole === 'owner' || userRole === 'editor';

  return (
    <div>
      <div>
        <h1>{project.name}</h1>
        <p>Tu rol: {userRole}</p>
        
        <Link to="/projects">
          <button>Volver a Proyectos</button>
        </Link>

        {canEdit && (
          <Link to={`/projects/${id}/edit`}>
            <button>Editar Proyecto</button>
          </Link>
        )}

        {isOwner && (
          <button onClick={handleDelete}>
            Eliminar Proyecto
          </button>
        )}
      </div>

      <div>
        <h2>Información del Proyecto</h2>
        <p><strong>Descripción:</strong> {project.description || 'Sin descripción'}</p>
        <p><strong>Estado:</strong> {project.status}</p>
        <p><strong>Color:</strong> 
          <span style={{ 
            display: 'inline-block', 
            width: '20px', 
            height: '20px', 
            backgroundColor: project.color,
            marginLeft: '8px',
            border: '1px solid #ccc'
          }}></span>
        </p>
        {project.deadline && (
          <p><strong>Fecha límite:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
        )}
        <p><strong>Creado:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
      </div>

      <div>
        <h2>Owner</h2>
        <p>{project.owner.name} ({project.owner.email})</p>
      </div>

      <div>
        <h2>Colaboradores ({project.collaborators.length})</h2>
        {project.collaborators.length === 0 ? (
          <p>No hay colaboradores en este proyecto.</p>
        ) : (
          <ul>
            {project.collaborators.map(collab => (
              <li key={collab._id}>
                {collab.user.name} ({collab.user.email}) - Rol: {collab.role}
              </li>
            ))}
          </ul>
        )}
        
        {isOwner && (
          <button>Agregar Colaborador</button>
        )}
      </div>

      <div>
        <h2>Tareas ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <p>No hay tareas en este proyecto.</p>
        ) : (
          <div>
            {tasks.map(task => (
              <div key={task._id}>
                <h3>{task.title}</h3>
                <p>Estado: {task.status}</p>
                <p>Prioridad: {task.priority}</p>
                {task.dueDate && (
                  <p>Vence: {new Date(task.dueDate).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <button>Crear Nueva Tarea</button>
        )}
      </div>
    </div>
  );
}