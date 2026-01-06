// Extraer mensaje de error del backend
export const getErrorMessage = (error) => {
  // Error de red (backend no responde)
  if (!error.response) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }

  // Error del backend con mensaje
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Error de validación de Mongoose
  if (error.response?.data?.errors) {
    // Si hay múltiples errores, tomar el primero
    const errors = error.response.data.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors[0];
    }
  }

  // Status codes específicos
  switch (error.response?.status) {
    case 400:
      return 'Datos inválidos. Verifica la información ingresada.';
    case 401:
      return 'No estás autenticado. Inicia sesión nuevamente.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 500:
      return 'Error del servidor. Intenta más tarde.';
    default:
      return 'Ocurrió un error inesperado.';
  }
};

// Formatear errores de validación para formularios
export const formatValidationErrors = (error) => {
  const errors = {};

  // Si el backend devuelve errores por campo
  if (error.response?.data?.errors) {
    const backendErrors = error.response.data.errors;
    
    // Si es un array de mensajes
    if (Array.isArray(backendErrors)) {
      errors.general = backendErrors[0];
    } 
    // Si es un objeto con errores por campo
    else if (typeof backendErrors === 'object') {
      Object.keys(backendErrors).forEach(key => {
        errors[key] = backendErrors[key];
      });
    }
  } else {
    // Error general
    errors.general = getErrorMessage(error);
  }

  return errors;
};

// Manejar error de autenticación
export const handleAuthError = (error, logout) => {
  if (error.response?.status === 401) {
    logout();
    return 'Sesión expirada. Inicia sesión nuevamente.';
  }
  return getErrorMessage(error);
};