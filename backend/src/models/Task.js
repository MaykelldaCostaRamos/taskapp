import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        minlength: [3, 'Mínimo 3 caracteres'],
        maxlength: [100, 'Máximo 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    
    // 📁 RELACIÓN CON PROYECTO
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'El proyecto es obligatorio'],
        immutable: true  // 🔒 No se puede mover de proyecto
    },
    
    // 👤 ASIGNACIÓN (solo colaboradores del proyecto)
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // 📅 FECHAS
    dueDate: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
    
}, {
    timestamps: true
});

// Índices
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ dueDate: 1 });

// 🛡️ Pre-save: Auto-completar fecha cuando status cambia a 'completed'
TaskSchema.pre('save', async function() {
    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    
    if (this.isModified('status') && this.status !== 'completed') {
        this.completedAt = null;
    }
});

export default mongoose.model('Task', TaskSchema);