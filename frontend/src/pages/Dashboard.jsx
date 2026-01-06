import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <div>
        <h2>Datos del Usuario</h2>
        <p><strong>ID:</strong> {user?.id}</p>
        <p><strong>Nombre:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Avatar:</strong> {user?.avatar || 'No tiene'}</p>
        <p><strong>Cuenta creada:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
      </div>

      <div>
        <h3>Preferencias</h3>
        <p><strong>Tema:</strong> {user?.preferences?.theme || 'light'}</p>
        <p><strong>Idioma:</strong> {user?.preferences?.language || 'es'}</p>
        <p><strong>Notificaciones:</strong> {user?.preferences?.notifications?.email ? 'Activadas' : 'Desactivadas'}</p>
      </div>

      <div>
        <h3>Proyectos</h3>
        <p><strong>Proyectos propios:</strong> {user?.ownedProjects?.length || 0}</p>
        <p><strong>Proyectos compartidos:</strong> {user?.sharedProjects?.length || 0}</p>
      </div>

      <button onClick={handleLogout}>
        Cerrar Sesión
      </button>
    </div>
  );
}