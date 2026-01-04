import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

// ===== CREAR PROYECTO =====
export const createProject = async (req, res, next) => {
  try {
    const { name, description, deadline, color } = req.body;
    const userId = req.user.userId;

    // 1. Validar nombre
    if (!name || name.trim().length < 3 || name.trim().length > 100) {
      const error = new Error('El nombre debe tener entre 3 y 100 caracteres');
      error.statusCode = 400;
      throw error;
    }

    // 2. Verificar que no exista un proyecto con el mismo nombre para este usuario
    const existingProject = await Project.findOne({ 
      owner: userId, 
      name: name.trim() 
    });

    if (existingProject) {
      const error = new Error('Ya tienes un proyecto con este nombre');
      error.statusCode = 400;
      throw error;
    }

    // 3. Crear proyecto
    const newProject = await Project.create({
      name: name.trim(),
      description: description?.trim() || '',
      deadline: deadline || null,
      color: color || '#3b82f6',
      owner: userId
    });

    // 4. Agregar el proyecto al array ownedProjects del usuario
    await User.findByIdAndUpdate(userId, {
      $push: { ownedProjects: newProject._id }
    });

    // 5. Responder con el proyecto creado
    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      project: newProject
    });

  } catch (error) {
    next(error);
  }
};


// ===== OBTENER TODOS LOS PROYECTOS DEL USUARIO =====
export const getProjects = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 1. Buscar proyectos donde el usuario es owner O colaborador
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    })
    .populate('owner', 'name email avatar')
    .populate('collaborators.user', 'name email avatar')
    .sort({ createdAt: -1 });

    // 2. Separar proyectos propios de compartidos
    const ownedProjects = projects.filter(
      p => p.owner._id.toString() === userId
    );

    const sharedProjects = projects.filter(
      p => p.owner._id.toString() !== userId
    );

    // 3. Responder con ambas listas
    res.json({
      success: true,
      projects: {
        owned: ownedProjects,
        shared: sharedProjects
      }
    });

  } catch (error) {
    next(error);
  }
};


// ===== OBTENER UN PROYECTO POR ID =====
export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Buscar proyecto y verificar acceso
    const project = await Project.findById(id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verificar que el usuario tenga acceso
    const access = project.hasAccess(userId);
    if (!access.hasAccess) {
      const error = new Error('No tienes acceso a este proyecto');
      error.statusCode = 403;
      throw error;
    }

    // 3. Obtener tareas del proyecto
    const tasks = await Task.find({ project: id })
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });

    // 4. Responder con proyecto y tareas
    res.json({
      success: true,
      project,
      tasks,
      userRole: access.role  // owner, editor, o viewer
    });

  } catch (error) {
    next(error);
  }
};


// ===== ACTUALIZAR PROYECTO =====
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, deadline, color, status } = req.body;
    const userId = req.user.userId;

    // 1. Buscar proyecto
    const project = await Project.findById(id);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verificar permisos (solo owner y editor pueden actualizar)
    if (!project.canEdit(userId)) {
      const error = new Error('No tienes permiso para editar este proyecto');
      error.statusCode = 403;
      throw error;
    }

    // 3. Actualizar campos que vengan en el body
    if (name !== undefined) {
      if (name.trim().length < 3 || name.trim().length > 100) {
        const error = new Error('El nombre debe tener entre 3 y 100 caracteres');
        error.statusCode = 400;
        throw error;
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = description.trim();
    }

    if (deadline !== undefined) {
      project.deadline = deadline || null;
    }

    if (color !== undefined) {
      project.color = color;
    }

    if (status !== undefined) {
      if (!['active', 'archived', 'completed'].includes(status)) {
        const error = new Error('Estado inválido');
        error.statusCode = 400;
        throw error;
      }
      project.status = status;
    }

    // 4. Guardar cambios
    await project.save();

    // 5. Responder con proyecto actualizado
    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      project
    });

  } catch (error) {
    next(error);
  }
};


// ===== ELIMINAR PROYECTO =====
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Buscar proyecto
    const project = await Project.findById(id);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verificar que sea el owner (solo el owner puede eliminar)
    if (project.owner.toString() !== userId) {
      const error = new Error('Solo el owner puede eliminar el proyecto');
      error.statusCode = 403;
      throw error;
    }

    // 3. Eliminar todas las tareas del proyecto
    await Task.deleteMany({ project: id });

    // 4. Remover proyecto del array ownedProjects del usuario
    await User.findByIdAndUpdate(userId, {
      $pull: { ownedProjects: id }
    });

    // 5. Remover proyecto de sharedProjects de colaboradores
    await User.updateMany(
      { 'sharedProjects.projectId': id },
      { $pull: { sharedProjects: { projectId: id } } }
    );

    // 6. Eliminar el proyecto
    await Project.findByIdAndDelete(id);

    // 7. Responder con éxito
    res.json({
      success: true,
      message: 'Proyecto y todos sus datos eliminados exitosamente'
    });

  } catch (error) {
    next(error);
  }
};


// ===== AGREGAR COLABORADOR =====
export const addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;  // ID del proyecto
    const { userId: collaboratorId, role } = req.body;
    const ownerId = req.user.userId;

    // 1. Validar que vengan los datos
    if (!collaboratorId || !role) {
      const error = new Error('Se requiere userId y role');
      error.statusCode = 400;
      throw error;
    }

    // 2. Validar role
    if (!['viewer', 'editor'].includes(role)) {
      const error = new Error('Role inválido. Debe ser viewer o editor');
      error.statusCode = 400;
      throw error;
    }

    // 3. Buscar proyecto
    const project = await Project.findById(id);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 4. Verificar que el usuario actual sea el owner
    if (project.owner.toString() !== ownerId) {
      const error = new Error('Solo el owner puede agregar colaboradores');
      error.statusCode = 403;
      throw error;
    }

    // 5. Verificar que el colaborador exista
    const collaborator = await User.findById(collaboratorId);

    if (!collaborator) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 6. Verificar que no sea el mismo owner
    if (collaboratorId === ownerId) {
      const error = new Error('No puedes agregarte como colaborador');
      error.statusCode = 400;
      throw error;
    }

    // 7. Verificar que no sea ya colaborador
    const isAlreadyCollaborator = project.collaborators.some(
      c => c.user.toString() === collaboratorId
    );

    if (isAlreadyCollaborator) {
      const error = new Error('El usuario ya es colaborador de este proyecto');
      error.statusCode = 400;
      throw error;
    }

    // 8. Agregar colaborador al proyecto
    project.collaborators.push({
      user: collaboratorId,
      role,
      addedAt: new Date()
    });

    await project.save();

    // 9. Agregar proyecto a sharedProjects del colaborador
    await User.findByIdAndUpdate(collaboratorId, {
      $push: {
        sharedProjects: {
          projectId: id,
          role,
          sharedAt: new Date()
        }
      }
    });

    // 10. Responder con éxito
    res.json({
      success: true,
      message: 'Colaborador agregado exitosamente',
      project
    });

  } catch (error) {
    next(error);
  }
};


// ===== REMOVER COLABORADOR =====
export const removeCollaborator = async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.userId;

    // 1. Buscar proyecto
    const project = await Project.findById(id);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verificar que el usuario actual sea el owner
    if (project.owner.toString() !== userId) {
      const error = new Error('Solo el owner puede remover colaboradores');
      error.statusCode = 403;
      throw error;
    }

    // 3. Verificar que el colaborador exista en el proyecto
    const collaboratorIndex = project.collaborators.findIndex(
      c => c.user.toString() === collaboratorId
    );

    if (collaboratorIndex === -1) {
      const error = new Error('El usuario no es colaborador de este proyecto');
      error.statusCode = 404;
      throw error;
    }

    // 4. Remover colaborador del proyecto
    project.collaborators.splice(collaboratorIndex, 1);
    await project.save();

    // 5. Remover proyecto de sharedProjects del colaborador
    await User.findByIdAndUpdate(collaboratorId, {
      $pull: { sharedProjects: { projectId: id } }
    });

    // 6. Desasignar al colaborador de todas las tareas del proyecto
    await Task.updateMany(
      { project: id },
      { $pull: { assignedTo: collaboratorId } }
    );

    // 7. Responder con éxito
    res.json({
      success: true,
      message: 'Colaborador removido exitosamente'
    });

  } catch (error) {
    next(error);
  }
};


// ===== ACTUALIZAR ROL DE COLABORADOR =====
export const updateCollaboratorRole = async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = req.user.userId;

    // 1. Validar role
    if (!role || !['viewer', 'editor'].includes(role)) {
      const error = new Error('Role inválido. Debe ser viewer o editor');
      error.statusCode = 400;
      throw error;
    }

    // 2. Buscar proyecto
    const project = await Project.findById(id);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verificar que el usuario actual sea el owner
    if (project.owner.toString() !== userId) {
      const error = new Error('Solo el owner puede cambiar roles');
      error.statusCode = 403;
      throw error;
    }

    // 4. Buscar colaborador en el proyecto
    const collaborator = project.collaborators.find(
      c => c.user.toString() === collaboratorId
    );

    if (!collaborator) {
      const error = new Error('El usuario no es colaborador de este proyecto');
      error.statusCode = 404;
      throw error;
    }

    // 5. Actualizar role
    collaborator.role = role;
    await project.save();

    // 6. Actualizar role en sharedProjects del colaborador
    await User.updateOne(
      { _id: collaboratorId, 'sharedProjects.projectId': id },
      { $set: { 'sharedProjects.$.role': role } }
    );

    // 7. Responder con éxito
    res.json({
      success: true,
      message: 'Role actualizado exitosamente',
      project
    });

  } catch (error) {
    next(error);
  }
};