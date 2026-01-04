import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares globales
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true  // Permitir cookies en CORS (Permite enviar/recibir cookies)
}));
app.use(express.json());
app.use(cookieParser());  // Para leer cookies

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '✅ API funcionando correctamente' });
});

// Aquí irán las rutas (próximo paso)
// app.use('/api/auth', authRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/tasks', taskRoutes);

// Middleware de manejo de errores (siempre al final)
app.use(errorHandler);  // Captura todos los errores

// Puerto
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});