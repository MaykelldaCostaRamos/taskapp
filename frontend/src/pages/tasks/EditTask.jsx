import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';

export default function EditTask() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignedTo: []
  });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [taskId, projectId]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [taskResponse, projectResponse] = await Promise.all([
        axios.get(`/projects/tasks/${taskId}`),
        axios.get(`/projects/${projectId}`)
      ]);

      const task = taskResponse.data.task;
      const project = projectResponse.data.project;

      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo: task.assignedTo?.map(u => u._id) || []
      });

      const users = [
        project.owner,
        ...project.collaborators.map(c => c.user)
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
      await axios.put(`/projects/tasks/${taskId}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        assignedTo: formData.assignedTo
      });

      navigate(`/projects/${projectId}/tasks/${taskId}`);
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h1>Editar Tarea</h1>

      <Link to={`/projects/${projectId}/tasks/${taskId}`}>
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
          />
          {errors.title && <span>{errors.title}</span>}
        </div>

        <div>
          <label>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div>
          <label>Estado</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="pending">Pendiente</option>
            <option value="in-progress">En Progreso</option>
            <option value="completed">Completada</option>
          </select>
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
          {submitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}