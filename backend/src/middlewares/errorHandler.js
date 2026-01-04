// ===== MIDDLEWARE DE MANEJO CENTRALIZADO DE ERRORES =====

export const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error capturado:', err);

  // 1. Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Error de validación',
      errors: messages
    });
  }

  // 2. Error de clave duplicada (email, etc.)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const fieldNames = {
      email: 'El email',
      name: 'El nombre'
    };
    return res.status(400).json({
      success: false,
      message: `${fieldNames[field] || 'Este valor'} ya está registrado`
    });
  }

  // 3. Error de Cast (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `ID inválido: ${err.value}`
    });
  }

  // 4. Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // 5. Error personalizado con statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Error en la petición'
    });
  }

  // 6. Error genérico (500)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message
  });
};