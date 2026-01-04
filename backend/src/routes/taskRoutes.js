import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  toggleTaskStatus
} from '../controllers/taskController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

// ===== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN =====
router.use(verifyToken);

// ===== RUTAS DE TAREAS =====
// Nota: Las rutas de tareas están bajo /projects/:projectId/tasks
router.post('/:projectId/tasks', createTask);              // Crear tarea en un proyecto
router.get('/:projectId/tasks', getTasks);                 // Obtener tareas de un proyecto

// Rutas para tareas específicas
router.get('/tasks/:id', getTask);                         // Obtener una tarea
router.put('/tasks/:id', updateTask);                      // Actualizar tarea
router.delete('/tasks/:id', deleteTask);                   // Eliminar tarea
router.patch('/tasks/:id/toggle', toggleTaskStatus);       // Toggle estado (pending ↔ completed)

export default router;