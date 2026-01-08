import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { getErrorMessage } from '../../utils/errorHandler';
import ErrorMessage from '../../components/ErrorMessage';

export default function CreateProject() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    color: '#3b82f6'
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const response = await axios.post('/projects', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline || null,
        color: formData.color
      });

      navigate(`/projects/${response.data.project._id}`);
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Crear Nuevo Proyecto</h1>

      <Link to="/projects">
        <button>Volver a Proyectos</button>
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
            placeholder="Ej: Rediseño de sitio web"
          />
          {errors.name && <span>{errors.name}</span>}
        </div>

        <div>
          <label>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe el proyecto..."
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

        <button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Proyecto'}
        </button>
      </form>
    </div>
  );
}