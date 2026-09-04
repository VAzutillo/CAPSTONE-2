/**
 * Strong password policy validation.
 * Enforces: min 8 chars, uppercase, lowercase, number, special character.
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const hasUppercase = (str) => /[A-Z]/.test(str);
const hasLowercase = (str) => /[a-z]/.test(str);
const hasNumber = (str) => /\d/.test(str);
const hasSpecial = (str) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(str);

/**
 * Validates password against policy.
 * @param {string} password
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters` };
  }
  if (!hasUppercase(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowercase(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumber(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!hasSpecial(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&* etc.)' };
  }
  return { valid: true };
}

module.exports = { validatePassword, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH };
