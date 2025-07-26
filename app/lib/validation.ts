export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateUsername(username: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!username || username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
  }

  if (username.length > 50) {
    errors.push({ field: 'username', message: 'Username must be at most 50 characters long' });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers, underscores, and hyphens' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!password || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }

  if (password.length > 128) {
    errors.push({ field: 'password', message: 'Password must be at most 128 characters long' });
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateTweetContent(content: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!content || content.trim().length === 0) {
    errors.push({ field: 'content', message: 'Tweet content is required' });
  }

  if (content.length > 140) {
    errors.push({ field: 'content', message: 'Tweet must be 140 characters or less' });
  }

  return { isValid: errors.length === 0, errors };
}