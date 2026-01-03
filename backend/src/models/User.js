import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
    // ===== DATOS BÁSICOS =====
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false
    },
    
    // ===== PERFIL =====
    avatar: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: [200, 'La bio no puede exceder 200 caracteres'],
        default: ''
    },
    
    // ===== ESTADO DE CUENTA =====
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // ===== TOKENS DE SEGURIDAD =====
    verificationToken: {
        type: String,
        select: false
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    },
    
    // ===== RELACIONES CON PROYECTOS =====
    ownedProjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    sharedProjects: [{
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        },
        role: {
            type: String,
            enum: ['viewer', 'editor'],
            default: 'viewer'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // ===== PREFERENCIAS =====
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        language: {
            type: String,
            enum: ['es', 'en'],
            default: 'es'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            projectShared: {
                type: Boolean,
                default: true
            },
            taskUpdates: {
                type: Boolean,
                default: true
            }
        }
    },
    
    // ===== NOTIFICACIONES NO LEÍDAS =====
    unreadNotifications: {
        type: Number,
        default: 0
    }
    
}, {
    timestamps: true
});

// Índices
UserSchema.index({ email: 1 });
UserSchema.index({ 'sharedProjects.projectId': 1 });

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

export default User;