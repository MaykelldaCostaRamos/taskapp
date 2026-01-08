import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/projects');
      setProjects(response.data.projects);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div>
        <h1>Mis Proyectos</h1>
        <p>Bienvenido, {user?.name}</p>
        <Link to="/projects/create">
          <button>Crear Nuevo Proyecto</button>
        </Link>
        <Link to="/dashboard">
          <button>Volver al Dashboard</button>
        </Link>
      </div>

      <ErrorMessage message={error} />

      {/* Proyectos Propios */}
      <div>
        <h2>Mis Proyectos ({projects.owned.length})</h2>
        
        {projects.owned.length === 0 ? (
          <p>No tienes proyectos. Crea uno para empezar.</p>
        ) : (
          <div>
            {projects.owned.map(project => (
              <div key={project._id}>
                <h3>{project.name}</h3>
                <p>{project.description || 'Sin descripción'}</p>
                <p>Estado: {project.status}</p>
                <p>Colaboradores: {project.collaborators.length}</p>
                {project.deadline && (
                  <p>Fecha límite: {new Date(project.deadline).toLocaleDateString()}</p>
                )}
                <Link to={`/projects/${project._id}`}>
                  <button>Ver Detalles</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proyectos Compartidos */}
      <div>
        <h2>Proyectos Compartidos Conmigo ({projects.shared.length})</h2>
        
        {projects.shared.length === 0 ? (
          <p>No tienes proyectos compartidos.</p>
        ) : (
          <div>
            {projects.shared.map(project => (
              <div key={project._id}>
                <h3>{project.name}</h3>
                <p>{project.description || 'Sin descripción'}</p>
                <p>Owner: {project.owner.name} ({project.owner.email})</p>
                <p>Tu rol: {project.collaborators.find(c => c.user._id === user.id)?.role || 'viewer'}</p>
                <Link to={`/projects/${project._id}`}>
                  <button>Ver Detalles</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}