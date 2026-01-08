import { useState } from 'react';
import axios from '../api/axios';
import { getErrorMessage } from '../utils/errorHandler';

export default function SearchUsers({ onSelectUser, excludeUserIds = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery);
    setError(null);

    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/auth/search?q=${searchQuery}`);
      
      // Filtrar usuarios que ya son colaboradores
      const filteredResults = response.data.users.filter(
        user => !excludeUserIds.includes(user._id)
      );
      
      setResults(filteredResults);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    onSelectUser(user);
    setQuery('');
    setResults([]);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {loading && <p>Buscando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results.length > 0 && (
        <div style={{ 
          border: '1px solid #ccc', 
          marginTop: '8px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {results.map(user => (
            <div 
              key={user._id}
              onClick={() => handleSelectUser(user)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee'
              }}
            >
              <div>
                <strong>{user.name}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {user.email}
              </div>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !loading && (
        <p>No se encontraron usuarios</p>
      )}
    </div>
  );
}