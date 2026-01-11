import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import SearchUsers from '../../components/SearchUsers';
import CollaboratorList from '../../components/CollaboratorList';
import TaskList from '../../components/TaskList';
import KanbanBoard from '../../components/KanbanBoard';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vista: 'list' o 'kanban'
  const [view, setView] = useState('kanban');

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
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
        <Link to="/projects">
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Volver a Proyectos
          </button>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-lg shadow-md flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: project.color }}
              >
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tu rol: <span className="font-semibold text-blue-600 dark:text-blue-400">{userRole}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/projects">
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  ← Volver
                </button>
              </Link>

              {canEdit && (
                <Link to={`/projects/${id}/edit`}>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    ✏️ Editar
                  </button>
                </Link>
              )}

              {isOwner && (
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          {/* Información del proyecto */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {project.status}
              </p>
            </div>

            {project.deadline && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Fecha límite</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(project.deadline).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Colaboradores</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {project.collaborators.length}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tareas</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {tasks.length}
              </p>
            </div>
          </div>

          {project.description && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
            </div>
          )}
        </div>

        {/* Colaboradores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            👥 Colaboradores ({project.collaborators.length})
          </h2>

          <CollaboratorList
            projectId={id}
            collaborators={project.collaborators}
            isOwner={isOwner}
            onUpdate={fetchProject}
          />

          {isOwner && (
            <div className="mt-4">
              {!showAddCollaborator ? (
                <button 
                  onClick={() => setShowAddCollaborator(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  ➕ Agregar Colaborador
                </button>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Buscar Usuario
                  </h3>

                  <SearchUsers
                    onSelectUser={setSelectedUser}
                    excludeUserIds={excludeUserIds}
                  />

                  {selectedUser && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="mb-3 text-gray-900 dark:text-white">
                        Usuario seleccionado: <strong>{selectedUser.name}</strong> ({selectedUser.email})
                      </p>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Rol:
                        </label>
                        <select 
                          value={selectedRole} 
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                          <option value="viewer">Viewer (solo ver)</option>
                          <option value="editor">Editor (ver y editar)</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={handleAddCollaborator}
                          disabled={addingCollaborator}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {addingCollaborator ? 'Agregando...' : '✓ Agregar'}
                        </button>

                        <button 
                          onClick={() => {
                            setSelectedUser(null);
                            setShowAddCollaborator(false);
                          }}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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

        {/* Tareas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📋 Tareas ({tasks.length})
            </h2>

            <div className="flex flex-wrap gap-2">
              {/* Toggle Vista */}
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    view === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  📝 Lista
                </button>
                <button
                  onClick={() => setView('kanban')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    view === 'kanban'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  📊 Kanban
                </button>
              </div>

              {canEdit && (
                <Link to={`/projects/${id}/tasks/create`}>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    ➕ Nueva Tarea
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Vista condicional */}
          {view === 'list' ? (
            <TaskList
              tasks={tasks}
              projectId={id}
              canEdit={canEdit}
              isOwner={isOwner}
              onUpdate={fetchProject}
            />
          ) : (
            <KanbanBoard
              tasks={tasks}
              projectId={id}
              canEdit={canEdit}
              isOwner={isOwner}
              onUpdate={fetchProject}
            />
          )}
        </div>
      </div>
    </div>
  );
}