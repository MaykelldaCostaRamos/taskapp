import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    // 1. Obtener token desde cookie O desde header Authorization
    let token = req.cookies?.token;  // Desde cookie (desarrollo local)
    
    if (!token) {
      // Si no hay cookie, buscar en header (producción con localStorage)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);  // Remover "Bearer "
      }
    }

    // 2. Validar que exista el token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No estás autenticado'
      });
    }

    // 3. Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Agregar datos del usuario al request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    // 5. Continuar al siguiente middleware o controlador
    next();

  } catch (error) {
    // Token inválido o expirado
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación'
    });
  }
};