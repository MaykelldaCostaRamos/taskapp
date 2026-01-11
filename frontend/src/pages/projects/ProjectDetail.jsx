import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import SearchUsers from '../../components/SearchUsers';
import CollaboratorList from '../../components/CollaboratorList';
import TaskList from '../../components/TaskList';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para agregar colaborador
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [addingCollaborator, setAddingCollaborator] = useState(false);

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

  const handleAddCollaborator = async () => {
    if (!selectedUser) {
      alert('Selecciona un usuario primero');
      return;
    }

    setAddingCollaborator(true);
    setError(null);

    try {
      await axios.post(`/projects/${id}/collaborators`, {
        userId: selectedUser._id,
        role: selectedRole
      });

      await fetchProject();

      setSelectedUser(null);
      setSelectedRole('viewer');
      setShowAddCollaborator(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    } finally {
      setAddingCollaborator(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !project) {
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

  const excludeUserIds = [
    project.owner._id,
    ...project.collaborators.map(c => c.user._id)
  ];

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

      <ErrorMessage message={error} />

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
        
        <CollaboratorList
          projectId={id}
          collaborators={project.collaborators}
          isOwner={isOwner}
          onUpdate={fetchProject}
        />

        {isOwner && (
          <div style={{ marginTop: '16px' }}>
            {!showAddCollaborator ? (
              <button onClick={() => setShowAddCollaborator(true)}>
                Agregar Colaborador
              </button>
            ) : (
              <div style={{ 
                border: '1px solid #ccc', 
                padding: '16px',
                borderRadius: '4px'
              }}>
                <h3>Buscar Usuario</h3>
                
                <SearchUsers
                  onSelectUser={setSelectedUser}
                  excludeUserIds={excludeUserIds}
                />

                {selectedUser && (
                  <div style={{ marginTop: '16px' }}>
                    <p>Usuario seleccionado: <strong>{selectedUser.name}</strong> ({selectedUser.email})</p>
                    
                    <div>
                      <label>Rol:</label>
                      <select 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="viewer">Viewer (solo ver)</option>
                        <option value="editor">Editor (ver y editar)</option>
                      </select>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <button 
                        onClick={handleAddCollaborator}
                        disabled={addingCollaborator}
                      >
                        {addingCollaborator ? 'Agregando...' : 'Agregar'}
                      </button>

                      <button 
                        onClick={() => {
                          setSelectedUser(null);
                          setShowAddCollaborator(false);
                        }}
                        style={{ marginLeft: '8px' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2>Tareas ({tasks.length})</h2>
        
        <TaskList
          tasks={tasks}
          projectId={id}
          canEdit={canEdit}
          isOwner={isOwner}
          onUpdate={fetchProject}
        />

        {canEdit && (
          <Link to={`/projects/${id}/tasks/create`}>
            <button>Crear Nueva Tarea</button>
          </Link>
        )}
      </div>
    </div>
  );
}