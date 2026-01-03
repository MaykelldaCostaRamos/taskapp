import mongoose from 'mongoose';
import crypto from 'crypto';

const InvitationSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['viewer', 'editor'],
        default: 'viewer'
    },
    token: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(32).toString('hex')
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 días
        index: true
    }
}, {
    timestamps: true
});

// Índices
InvitationSchema.index({ project: 1, email: 1 });
InvitationSchema.index({ token: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });  // 🗑️ Auto-delete

// 📌 Método: Verificar si está expirada
InvitationSchema.methods.isExpired = function() {
    return this.expiresAt < new Date();
};

export default mongoose.model('Invitation', InvitationSchema);