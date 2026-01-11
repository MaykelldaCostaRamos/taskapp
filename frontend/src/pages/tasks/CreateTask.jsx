import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';

export default function CreateTask() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: []
  });

  const [project, setProject] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`/projects/${projectId}`);
      setProject(response.data.project);

      // Usuarios disponibles: owner + colaboradores
      const users = [
        response.data.project.owner,
        ...response.data.project.collaborators.map(c => c.user)
      ];
      setAvailableUsers(users);
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleAssignedToChange = (userId) => {
    setFormData(prev => {
      const newAssignedTo = prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId];

      return { ...prev, assignedTo: newAssignedTo };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = {};

    if (!formData.title || formData.title.trim().length < 3) {
      validationErrors.title = 'El título debe tener al menos 3 caracteres';
    }

    if (formData.title.trim().length > 100) {
      validationErrors.title = 'El título no puede exceder 100 caracteres';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/projects/${projectId}/tasks`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        assignedTo: formData.assignedTo
      });

      navigate(`/projects/${projectId}`);
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h1>Crear Nueva Tarea</h1>
      <p>Proyecto: {project?.name}</p>

      <Link to={`/projects/${projectId}`}>
        <button>Cancelar</button>
      </Link>

      <ErrorMessage message={serverError} />

      <form onSubmit={handleSubmit}>
        <div>
          <label>Título *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ej: Diseñar mockups"
          />
          {errors.title && <span>{errors.title}</span>}
        </div>

        <div>
          <label>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe la tarea..."
            rows="4"
          />
        </div>

        <div>
          <label>Prioridad</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>

        <div>
          <label>Fecha Límite</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Asignar a:</label>
          {availableUsers.map(user => (
            <div key={user._id}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.assignedTo.includes(user._id)}
                  onChange={() => handleAssignedToChange(user._id)}
                />
                {user.name} ({user.email})
              </label>
            </div>
          ))}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear Tarea'}
        </button>
      </form>
    </div>
  );
}