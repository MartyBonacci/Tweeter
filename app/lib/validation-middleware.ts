import { z } from "zod";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

/**
 * Validates form data against a Zod schema
 */
export function validateFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>
): ValidationResult {
  try {
    // Convert FormData to object
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Validate with Zod schema
    const validatedData = schema.parse(data);
    
    return {
      isValid: true,
      errors: [],
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return {
        isValid: false,
        errors
      };
    }
    
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Validates JSON body against a Zod schema
 */
export function validateJsonBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): ValidationResult {
  try {
    const validatedData = schema.parse(body);
    
    return {
      isValid: true,
      errors: [],
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return {
        isValid: false,
        errors
      };
    }
    
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Validates URL parameters against a Zod schema
 */
export function validateParams<T>(
  params: Record<string, string | undefined>,
  schema: z.ZodSchema<T>
): ValidationResult {
  try {
    const validatedData = schema.parse(params);
    
    return {
      isValid: true,
      errors: [],
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return {
        isValid: false,
        errors
      };
    }
    
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(
  url: URL,
  schema: z.ZodSchema<T>
): ValidationResult {
  try {
    const queryData: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      queryData[key] = value;
    }
    
    const validatedData = schema.parse(queryData);
    
    return {
      isValid: true,
      errors: [],
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return {
        isValid: false,
        errors
      };
    }
    
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Creates a standardized error response for validation failures
 */
export function createValidationErrorResponse(errors: ValidationError[]): Response {
  return new Response(JSON.stringify({ errors }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}