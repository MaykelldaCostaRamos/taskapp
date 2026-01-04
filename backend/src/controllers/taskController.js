import Task from '../models/Task.js';
import Project from '../models/Project.js';

// ===== CREAR TAREA =====
export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;
    const { projectId } = req.params;
    const userId = req.user.userId;

    // 1. Validar título
    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      const error = new Error('El título debe tener entre 3 y 100 caracteres');
      error.statusCode = 400;
      throw error;
    }

    // 2. Buscar proyecto
    const project = await Project.findById(projectId);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verificar que el usuario tenga acceso al proyecto
    const access = project.hasAccess(userId);
    if (!access.hasAccess) {
      const error = new Error('No tienes acceso a este proyecto');
      error.statusCode = 403;
      throw error;
    }

    // 4. Verificar que pueda editar (solo owner y editor pueden crear tareas)
    if (!project.canEdit(userId)) {
      const error = new Error('No tienes permiso para crear tareas en este proyecto');
      error.statusCode = 403;
      throw error;
    }

    // 5. Validar assignedTo (opcional)
    let validAssignedTo = [];
    if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
      // Verificar que todos los asignados sean colaboradores del proyecto
      const ownerId = project.owner.toString();
      const collaboratorIds = project.collaborators.map(c => c.user.toString());
      const validIds = [ownerId, ...collaboratorIds];

      for (const id of assignedTo) {
        if (!validIds.includes(id.toString())) {
          const error = new Error('Solo puedes asignar tareas a colaboradores del proyecto');
          error.statusCode = 400;
          throw error;
        }
      }
      validAssignedTo = assignedTo;
    }

    // 6. Crear tarea
    const newTask = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'medium',
      project: projectId,
      assignedTo: validAssignedTo,
      dueDate: dueDate || null
    });

    // 7. Poblar assignedTo para la respuesta
    await newTask.populate('assignedTo', 'name email avatar');

    // 8. Responder con la tarea creada
    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      task: newTask
    });

  } catch (error) {
    next(error);
  }
};


// ===== OBTENER TAREAS DE UN PROYECTO =====
export const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // 1. Buscar proyecto
    const project = await Project.findById(projectId);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verificar acceso
    const access = project.hasAccess(userId);
    if (!access.hasAccess) {
      const error = new Error('No tienes acceso a este proyecto');
      error.statusCode = 403;
      throw error;
    }

    // 3. Obtener tareas del proyecto
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });

    // 4. Responder con las tareas
    res.json({
      success: true,
      tasks
    });

  } catch (error) {
    next(error);
  }
};


// ===== OBTENER UNA TAREA ESPECÍFICA =====
export const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Buscar tarea
    const task = await Task.findById(id)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name owner');

    if (!task) {
      const error = new Error('Tarea no encontrada');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verificar acceso al proyecto de la tarea
    const project = await Project.findById(task.project._id);
    const access = project.hasAccess(userId);
    
    if (!access.hasAccess) {
      const error = new Error('No tienes acceso a esta tarea');
      error.statusCode = 403;
      throw error;
    }

    // 3. Responder con la tarea
    res.json({
      success: true,
      task
    });

  } catch (error) {
    next(error);
  }
};


// ===== ACTUALIZAR TAREA =====
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const userId = req.user.userId;

    // 1. Buscar tarea
    const task = await Task.findById(id);

    if (!task) {
      const error = new Error('Tarea no encontrada');
      error.statusCode = 404;
      throw error;
    }

    // 2. Buscar proyecto
    const project = await Project.findById(task.project);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verificar permisos (solo owner y editor pueden editar)
    if (!project.canEdit(userId)) {
      const error = new Error('No tienes permiso para editar tareas en este proyecto');
      error.statusCode = 403;
      throw error;
    }

    // 4. Actualizar campos que vengan en el body
    if (title !== undefined) {
      if (title.trim().length < 3 || title.trim().length > 100) {
        const error = new Error('El título debe tener entre 3 y 100 caracteres');
        error.statusCode = 400;
        throw error;
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (status !== undefined) {
      if (!['pending', 'in-progress', 'completed'].includes(status)) {
        const error = new Error('Estado inválido');
        error.statusCode = 400;
        throw error;
      }
      task.status = status;
    }

    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        const error = new Error('Prioridad inválida');
        error.statusCode = 400;
        throw error;
      }
      task.priority = priority;
    }

    if (assignedTo !== undefined) {
      // Validar que todos sean colaboradores del proyecto
      const ownerId = project.owner.toString();
      const collaboratorIds = project.collaborators.map(c => c.user.toString());
      const validIds = [ownerId, ...collaboratorIds];

      if (Array.isArray(assignedTo)) {
        for (const id of assignedTo) {
          if (!validIds.includes(id.toString())) {
            const error = new Error('Solo puedes asignar tareas a colaboradores del proyecto');
            error.statusCode = 400;
            throw error;
          }
        }
        task.assignedTo = assignedTo;
      } else {
        task.assignedTo = [];
      }
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
    }

    // 5. Guardar cambios
    await task.save();

    // 6. Poblar para la respuesta
    await task.populate('assignedTo', 'name email avatar');

    // 7. Responder con tarea actualizada
    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      task
    });

  } catch (error) {
    next(error);
  }
};


// ===== ELIMINAR TAREA =====
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Buscar tarea
    const task = await Task.findById(id);

    if (!task) {
      const error = new Error('Tarea no encontrada');
      error.statusCode = 404;
      throw error;
    }

    // 2. Buscar proyecto
    const project = await Project.findById(task.project);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verificar que sea el owner (solo el owner puede eliminar tareas)
    if (project.owner.toString() !== userId) {
      const error = new Error('Solo el owner puede eliminar tareas');
      error.statusCode = 403;
      throw error;
    }

    // 4. Eliminar tarea
    await Task.findByIdAndDelete(id);

    // 5. Responder con éxito
    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};


// ===== CAMBIAR ESTADO DE TAREA (toggle) =====
export const toggleTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Buscar tarea
    const task = await Task.findById(id);

    if (!task) {
      const error = new Error('Tarea no encontrada');
      error.statusCode = 404;
      throw error;
    }

    // 2. Buscar proyecto
    const project = await Project.findById(task.project);

    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verificar permisos (owner y editor pueden cambiar estado)
    if (!project.canEdit(userId)) {
      const error = new Error('No tienes permiso para cambiar el estado de esta tarea');
      error.statusCode = 403;
      throw error;
    }

    // 4. Toggle del estado
    if (task.status === 'completed') {
      task.status = 'pending';
    } else {
      task.status = 'completed';
    }

    // 5. Guardar cambios
    await task.save();

    // 6. Poblar para la respuesta
    await task.populate('assignedTo', 'name email avatar');

    // 7. Responder con tarea actualizada
    res.json({
      success: true,
      task
    });

  } catch (error) {
    next(error);
  }
};