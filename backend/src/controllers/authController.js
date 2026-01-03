import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Invitation from '../models/Invitation.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ===== REGISTRO DE USUARIO =====
export const registerUser = async (req, res) => {
  try {
    // 1. Extraer datos del body
    const { name, email, password } = req.body;

    // 2. Validar que vengan todos los campos
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // 3. Validar formato de email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // 4. Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // 5. Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
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
    console.error('Error en registerUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
};


// ===== LOGIN DE USUARIO =====
export const loginUser = async (req, res) => {
  try {
    // 1. Extraer credenciales
    const { email, password } = req.body;

    // 2. Validar que vengan los datos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    // 3. Buscar usuario por email (incluyendo password con select)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 4. Verificar que la cuenta esté activa
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    // 5. Comparar contraseña usando el método del modelo
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 6. Generar token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  // Token válido por 7 días
    );

    // 7. Configurar cookie HTTP-only (seguro)
    res.cookie('token', token, {
      httpOnly: true,  // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production',  // Solo HTTPS en producción
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Protección contra CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días en milisegundos
    });

    // 8. Responder con datos del usuario (sin password)
    res.json({
      success: true,
      message: 'Login exitoso',
      token,  // El frontend puede guardarlo en localStorage
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Error en loginUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};


// ===== LOGOUT DE USUARIO =====
export const logoutUser = (req, res) => {
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
    console.error('Error en logoutUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};


// ===== OBTENER PERFIL DEL USUARIO =====
export const getProfile = async (req, res) => {
  try {
    // 1. Obtener userId del token (viene desde middleware verifyToken)
    const userId = req.user.userId;

    // 2. Buscar usuario en la BD
    const user = await User.findById(userId)
      .populate('ownedProjects', 'name status')  // Traer proyectos propios
      .populate('sharedProjects.projectId', 'name status');  // Traer proyectos compartidos

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
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
    console.error('Error en getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};


// ===== CAMBIAR CONTRASEÑA =====
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // 1. Validar que vengan ambos campos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar la contraseña actual y la nueva'
      });
    }

    // 2. Validar longitud de la nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // 3. Buscar usuario con password incluido
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // 4. Verificar que la contraseña actual sea correcta
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // 5. Verificar que la nueva contraseña sea diferente
    const isSamePassword = await user.comparePassword(newPassword);
    
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual'
      });
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
    console.error('Error en changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
};


// ===== ELIMINAR CUENTA Y TODOS LOS DATOS =====
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    // 1. Validar que venga la contraseña (confirmación)
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar tu contraseña para confirmar'
      });
    }

    // 2. Buscar usuario con password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // 3. Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
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
        { invitedBy: userId },  // Invitaciones que creó
        { email: user.email }   // Invitaciones que recibió
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
    console.error('Error en deleteAccount:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cuenta'
    });
  }
};


// ===== BUSCAR USUARIOS (para compartir proyectos) =====
export const searchUsers = async (req, res) => {
  try {
    // 1. Obtener query desde URL (?q=juan o ?query=juan)
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
    const regex = new RegExp('^' + escapedQuery, 'i');  // ^ = comienza con

    // 4. Buscar usuarios por email o nombre
    const users = await User.find({
      $or: [
        { email: { $regex: regex } },
        { name: { $regex: regex } }
      ],
      isActive: true,  // Solo usuarios activos
      _id: { $ne: req.user.userId }  // Excluir al usuario actual
    })
    .limit(10)  // Máximo 10 resultados
    .select('name email avatar')  // Solo campos necesarios
    .lean();  // Mejor performance

    // 5. Responder con resultados
    res.json({ 
      success: true, 
      users 
    });

  } catch (error) {
    console.error('Error en searchUsers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al buscar usuarios' 
    });
  }
};