import express from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole
} from '../controllers/projectController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

// ===== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN =====
router.use(verifyToken);  // Aplica a todas las rutas de este router

// ===== RUTAS DE PROYECTOS =====
router.post('/', createProject);                                    // Crear proyecto
router.get('/', getProjects);                                       // Obtener todos los proyectos
router.get('/:id', getProject);                                     // Obtener proyecto por ID
router.put('/:id', updateProject);                                  // Actualizar proyecto
router.delete('/:id', deleteProject);                               // Eliminar proyecto

// ===== RUTAS DE COLABORADORES =====
router.post('/:id/collaborators', addCollaborator);                 // Agregar colaborador
router.delete('/:id/collaborators/:collaboratorId', removeCollaborator);  // Remover colaborador
router.put('/:id/collaborators/:collaboratorId', updateCollaboratorRole); // Actualizar role

export default router;