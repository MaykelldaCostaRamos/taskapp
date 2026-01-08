import { useState } from 'react';
import axios from '../api/axios';
import { getErrorMessage } from '../utils/errorHandler';

export default function CollaboratorList({ 
  projectId, 
  collaborators, 
  isOwner, 
  onUpdate 
}) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleChangeRole = async (collaboratorId, currentRole) => {
    const newRole = currentRole === 'viewer' ? 'editor' : 'viewer';
    
    if (!window.confirm(`¿Cambiar rol a ${newRole}?`)) {
      return;
    }

    setLoading(collaboratorId);
    setError(null);

    try {
      await axios.put(`/projects/${projectId}/collaborators/${collaboratorId}`, {
        role: newRole
      });
      
      onUpdate();  // Refrescar datos del proyecto
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (collaboratorId, userName) => {
    if (!window.confirm(`¿Remover a ${userName} del proyecto?`)) {
      return;
    }

    setLoading(collaboratorId);
    setError(null);

    try {
      await axios.delete(`/projects/${projectId}/collaborators/${collaboratorId}`);
      
      onUpdate();  // Refrescar datos del proyecto
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  if (collaborators.length === 0) {
    return <p>No hay colaboradores en este proyecto.</p>;
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {collaborators.map(collab => (
        <div 
          key={collab._id}
          style={{
            padding: '12px',
            border: '1px solid #ccc',
            marginBottom: '8px',
            borderRadius: '4px'
          }}
        >
          <div>
            <strong>{collab.user.name}</strong>
            <span style={{ marginLeft: '8px', color: '#666' }}>
              ({collab.user.email})
            </span>
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <span>Rol: {collab.role}</span>
            
            {isOwner && (
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => handleChangeRole(collab.user._id, collab.role)}
                  disabled={loading === collab.user._id}
                  style={{ marginRight: '8px' }}
                >
                  {loading === collab.user._id 
                    ? 'Cambiando...' 
                    : `Cambiar a ${collab.role === 'viewer' ? 'editor' : 'viewer'}`
                  }
                </button>

                <button
                  onClick={() => handleRemove(collab.user._id, collab.user.name)}
                  disabled={loading === collab.user._id}
                >
                  {loading === collab.user._id ? 'Removiendo...' : 'Remover'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}