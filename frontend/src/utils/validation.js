// Validar formato de email
export const validateEmail = (email) => {
  const regex = /^\S+@\S+\.\S+$/;
  
  if (!email) {
    return 'El email es obligatorio';
  }
  
  if (!regex.test(email)) {
    return 'Email inválido';
  }
  
  return null; // Sin errores
};

// Validar contraseña
export const validatePassword = (password) => {
  if (!password) {
    return 'La contraseña es obligatoria';
  }
  
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  
  return null;
};

// Validar nombre
export const validateName = (name) => {
  if (!name) {
    return 'El nombre es obligatorio';
  }
  
  if (name.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (name.trim().length > 50) {
    return 'El nombre no puede exceder 50 caracteres';
  }
  
  return null;
};

// Validar confirmación de contraseña
export const validatePasswordConfirm = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Debes confirmar la contraseña';
  }
  
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }
  
  return null;
};

// Validar formulario de registro completo
export const validateRegisterForm = (name, email, password, confirmPassword) => {
  const errors = {};
  
  const nameError = validateName(name);
  if (nameError) errors.name = nameError;
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  
  const confirmError = validatePasswordConfirm(password, confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;
  
  return errors;
};

// Validar formulario de login completo
export const validateLoginForm = (email, password) => {
  const errors = {};
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  
  return errors;
};