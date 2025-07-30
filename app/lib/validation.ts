import { 
  userRegistrationSchema, 
  userLoginSchema, 
  tweetContentSchema 
} from './schemas';
import { ValidationError, ValidationResult, validateFormData } from './validation-middleware';

// Re-export types for backward compatibility
export type { ValidationError, ValidationResult };

/**
 * Validates username using Zod schema
 * @deprecated Use userRegistrationSchema or userLoginSchema directly
 */
export function validateUsername(username: string): ValidationResult {
  try {
    const usernameSchema = userRegistrationSchema.pick({ username: true });
    const result = usernameSchema.parse({ username });
    return { isValid: true, errors: [] };
  } catch (error: any) {
    if (error.issues) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { isValid: false, errors };
    }
    return { isValid: false, errors: [{ field: 'username', message: 'Invalid username' }] };
  }
}

/**
 * Validates email using Zod schema
 * @deprecated Use userRegistrationSchema directly
 */
export function validateEmail(email: string): ValidationResult {
  try {
    const emailSchema = userRegistrationSchema.pick({ email: true });
    const result = emailSchema.parse({ email });
    return { isValid: true, errors: [] };
  } catch (error: any) {
    if (error.issues) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { isValid: false, errors };
    }
    return { isValid: false, errors: [{ field: 'email', message: 'Invalid email' }] };
  }
}

/**
 * Validates password using Zod schema
 * @deprecated Use userRegistrationSchema directly
 */
export function validatePassword(password: string): ValidationResult {
  try {
    const passwordSchema = userRegistrationSchema.pick({ password: true });
    const result = passwordSchema.parse({ password });
    return { isValid: true, errors: [] };
  } catch (error: any) {
    if (error.issues) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { isValid: false, errors };
    }
    return { isValid: false, errors: [{ field: 'password', message: 'Invalid password' }] };
  }
}

/**
 * Validates tweet content using Zod schema
 * @deprecated Use tweetContentSchema directly
 */
export function validateTweetContent(content: string): ValidationResult {
  try {
    const result = tweetContentSchema.parse({ content });
    return { isValid: true, errors: [] };
  } catch (error: any) {
    if (error.issues) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { isValid: false, errors };
    }
    return { isValid: false, errors: [{ field: 'content', message: 'Invalid tweet content' }] };
  }
}