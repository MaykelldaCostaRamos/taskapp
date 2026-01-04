import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Invitation from '../models/Invitation.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ===== REGISTRO DE USUARIO =====
export const registerUser = async (req, res, next) => {
  try {
    // 1. Extraer datos del body
    const { name, email, password } = req.body;

    // 2. Validar que vengan todos los campos
    if (!name || !email || !password) {
      const error = new Error('Todos los campos son obligatorios');
      error.statusCode = 400;
      throw error;
    }

    // 3. Validar formato de email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      const error = new Error('Email inválido');
      error.statusCode = 400;
      throw error;
    }

    // 4. Validar longitud de contraseña
    if (password.length < 6) {
      const error = new Error('La contraseña debe tener al menos 6 caracteres');
      error.statusCode = 400;
      throw error;
    }

    // 5. Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const error = new Error('El email ya está registrado');
      error.statusCode = 400;
      throw error;
    }

    // 6. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Crear usuario en la BD
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword
    });

    // 8. Responder con éxito (sin enviar la contraseña)
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    next(error);  // 👈 Pasa el error al errorHandler
  }
};


// ===== LOGIN DE USUARIO =====
export const loginUser = async (req, res, next) => {
  try {
    // 1. Extraer credenciales
    const { email, password } = req.body;

    // 2. Validar que vengan los datos
    if (!email || !password) {
      const error = new Error('Email y contraseña son obligatorios');
      error.statusCode = 400;
      throw error;
    }

    // 3. Buscar usuario por email (incluyendo password con select)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // 4. Verificar que la cuenta esté activa
    if (!user.isActive) {
      const error = new Error('Cuenta desactivada');
      error.statusCode = 403;
      throw error;
    }

    // 5. Comparar contraseña usando el método del modelo
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // 6. Generar token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. Configurar cookie HTTP-only (seguro)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 8. Responder con datos del usuario (sin password)
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });

  } catch (error) {
    next(error);
  }
};


// ===== LOGOUT DE USUARIO =====
export const logoutUser = (req, res, next) => {
  try {
    // 1. Limpiar cookie del servidor
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    // 2. Responder con éxito
    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    next(error);
  }
};


// ===== OBTENER PERFIL DEL USUARIO =====
export const getProfile = async (req, res, next) => {
  try {
    // 1. Obtener userId del token (viene desde middleware verifyToken)
    const userId = req.user.userId;

    // 2. Buscar usuario en la BD
    const user = await User.findById(userId)
      .populate('ownedProjects', 'name status')
      .populate('sharedProjects.projectId', 'name status');

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 3. Responder con datos del perfil (sin password)
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isActive: user.isActive,
        isVerified: user.isVerified,
        preferences: user.preferences,
        ownedProjects: user.ownedProjects,
        sharedProjects: user.sharedProjects,
        unreadNotifications: user.unreadNotifications,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
};


// ===== ACTUALIZAR PERFIL =====
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, bio, avatar, preferences } = req.body;

    // 1. Buscar usuario
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 2. Actualizar solo los campos que vienen en el body
    if (name !== undefined) {
      if (name.trim().length < 2 || name.trim().length > 50) {
        const error = new Error('El nombre debe tener entre 2 y 50 caracteres');
        error.statusCode = 400;
        throw error;
      }
      user.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 200) {
        const error = new Error('La bio no puede exceder 200 caracteres');
        error.statusCode = 400;
        throw error;
      }
      user.bio = bio.trim();
    }

    if (avatar !== undefined) {
      if (avatar !== null && avatar !== '') {
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(avatar)) {
          const error = new Error('El avatar debe ser una URL válida');
          error.statusCode = 400;
          throw error;
        }
      }
      user.avatar = avatar || null;
    }

    if (preferences !== undefined) {
      if (preferences.theme && ['light', 'dark', 'auto'].includes(preferences.theme)) {
        user.preferences.theme = preferences.theme;
      }
      
      if (preferences.language && ['es', 'en'].includes(preferences.language)) {
        user.preferences.language = preferences.language;
      }
      
      if (preferences.notifications !== undefined) {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...preferences.notifications
        };
      }
    }

    // 3. Guardar cambios
    await user.save();

    // 4. Responder con perfil actualizado
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences
      }
    });

  } catch (error) {
    next(error);
  }
};


// ===== CAMBIAR CONTRASEÑA =====
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // 1. Validar que vengan ambos campos
    if (!currentPassword || !newPassword) {
      const error = new Error('Debes proporcionar la contraseña actual y la nueva');
      error.statusCode = 400;
      throw error;
    }

    // 2. Validar longitud de la nueva contraseña
    if (newPassword.length < 6) {
      const error = new Error('La nueva contraseña debe tener al menos 6 caracteres');
      error.statusCode = 400;
      throw error;
    }

    // 3. Buscar usuario con password incluido
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 4. Verificar que la contraseña actual sea correcta
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      const error = new Error('La contraseña actual es incorrecta');
      error.statusCode = 401;
      throw error;
    }

    // 5. Verificar que la nueva contraseña sea diferente
    const isSamePassword = await user.comparePassword(newPassword);
    
    if (isSamePassword) {
      const error = new Error('La nueva contraseña debe ser diferente a la actual');
      error.statusCode = 400;
      throw error;
    }

    // 6. Encriptar y guardar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // 7. Responder con éxito
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};


// ===== ELIMINAR CUENTA Y TODOS LOS DATOS =====
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    // 1. Validar que venga la contraseña (confirmación)
    if (!password) {
      const error = new Error('Debes proporcionar tu contraseña para confirmar');
      error.statusCode = 400;
      throw error;
    }

    // 2. Buscar usuario con password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      const error = new Error('Contraseña incorrecta');
      error.statusCode = 401;
      throw error;
    }

    // 4. Buscar todos los proyectos del usuario (como owner)
    const ownedProjects = await Project.find({ owner: userId });
    const ownedProjectIds = ownedProjects.map(p => p._id);

    // 5. Eliminar todas las tareas de esos proyectos
    await Task.deleteMany({ project: { $in: ownedProjectIds } });

    // 6. Eliminar todos los proyectos donde es owner
    await Project.deleteMany({ owner: userId });

    // 7. Eliminar al usuario de proyectos donde es colaborador
    await Project.updateMany(
      { 'collaborators.user': userId },
      { $pull: { collaborators: { user: userId } } }
    );

    // 8. Eliminar invitaciones relacionadas
    await Invitation.deleteMany({ 
      $or: [
        { invitedBy: userId },
        { email: user.email }
      ]
    });

    // 9. Finalmente, eliminar al usuario
    await User.findByIdAndDelete(userId);

    // 10. Limpiar cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    // 11. Responder con éxito
    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};


// ===== BUSCAR USUARIOS (para compartir proyectos) =====
export const searchUsers = async (req, res, next) => {
  try {
    // 1. Obtener query desde URL
    const query = (req.query.q || req.query.query || '').trim();
    
    // 2. Validar longitud mínima
    if (!query || query.length < 2) {
      return res.json({ 
        success: true, 
        users: [] 
      });
    }

    // 3. Escapar caracteres especiales de regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('^' + escapedQuery, 'i');

    // 4. Buscar usuarios por email o nombre
    const users = await User.find({
      $or: [
        { email: { $regex: regex } },
        { name: { $regex: regex } }
      ],
      isActive: true,
      _id: { $ne: req.user.userId }
    })
    .limit(10)
    .select('name email avatar')
    .lean();

    // 5. Responder con resultados
    res.json({ 
      success: true, 
      users 
    });

  } catch (error) {
    next(error);
  }
};