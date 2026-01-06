import axios from "axios";

// Crear instancia de Axios con configuración base
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:5000/api
  withCredentials: true, // Enviar cookies (para desarrollo local)
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de peticiones (agregar token si existe)
axiosInstance.interceptors.request.use(
  (config) => {
    // Obtener token de localstorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Interceptor de respuestas (manejar errores globales)
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Si el token expiró o es inválido (401)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
)

export default axiosInstance;
