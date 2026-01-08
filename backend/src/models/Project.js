import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [3, "Mínimo 3 caracteres"],
      maxlength: [100, "Máximo 100 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Máximo 500 caracteres"],
    },
    deadline: {
      type: Date,
      default: null,
    },

    // 👤 OWNER (siempre es el creador)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true, // 🔒 No se puede cambiar después de crear
    },

    // 👥 COLABORADORES con roles (sin duplicidad)
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["viewer", "editor"], // Simplificado: solo 2 roles
          default: "viewer",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 📊 METADATA
    status: {
      type: String,
      enum: ["active", "archived", "completed"],
      default: "active",
    },
    color: {
      type: String,
      default: "#3b82f6", // Color por defecto
    },
  },
  {
    timestamps: true,
  }
);

// Índices
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ "collaborators.user": 1 });
ProjectSchema.index({ status: 1 });

// 🛡️ Pre-save: Evitar que owner esté en collaborators
ProjectSchema.pre("save", async function () {
  if (!this.collaborators || this.collaborators.length === 0) {
    return;
  }

  const ownerIdStr = this.owner.toString();
  this.collaborators = this.collaborators.filter(
    (collab) => collab.user.toString() !== ownerIdStr
  );
});

// 📌 Método: Verificar si un usuario tiene acceso al proyecto
ProjectSchema.methods.hasAccess = function (userId) {
  const userIdStr = userId.toString();

  // Es el owner?
  const ownerId =
    typeof this.owner === 'object'
      ? this.owner._id.toString()
      : this.owner.toString();

  if (ownerId === userIdStr) {
    return { hasAccess: true, role: 'owner' };
  }

  const collaborator = this.collaborators.find(c => {
    const collabId =
      typeof c.user === 'object'
        ? c.user._id.toString()
        : c.user.toString();

    return collabId === userIdStr;
  });

  if (collaborator) {
    return { hasAccess: true, role: collaborator.role };
  }

  return { hasAccess: false, role: null };
};


// 📌 Método: Verificar si puede editar
ProjectSchema.methods.canEdit = function (userId) {
  const access = this.hasAccess(userId);
  return (
    access.hasAccess && (access.role === "owner" || access.role === "editor")
  );
};

export default mongoose.model("Project", ProjectSchema);
