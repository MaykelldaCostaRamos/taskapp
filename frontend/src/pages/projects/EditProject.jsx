import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    color: '#3b82f6',
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    setServerError(null);

    try {
      const response = await axios.get(`/projects/${id}`);
      const project = response.data.project;

      setFormData({
        name: project.name,
        description: project.description || '',
        deadline: project.deadline ? project.deadline.split('T')[0] : '',
        color: project.color,
        status: project.status
      });
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

    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = {};
    
    if (!formData.name || formData.name.trim().length < 3) {
      validationErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (formData.name.trim().length > 100) {
      validationErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(`/projects/${id}`, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline || null,
        color: formData.color,
        status: formData.status
      });

      navigate(`/projects/${id}`);
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
      <h1>Editar Proyecto</h1>

      <Link to={`/projects/${id}`}>
        <button>Cancelar</button>
      </Link>

      <ErrorMessage message={serverError} />

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre del Proyecto *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <span>{errors.name}</span>}
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
          <label>Fecha Límite</label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Color</label>
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Estado</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Activo</option>
            <option value="archived">Archivado</option>
            <option value="completed">Completado</option>
          </select>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}