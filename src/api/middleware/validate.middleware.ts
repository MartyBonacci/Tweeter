import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware - validates request body against Zod schema
 * Returns 400 with formatted errors if validation fails
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate request body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          error: 'Validation failed',
          errors,
          details: errors, // Include details for backward compatibility
        });
      } else {
        next(error);
      }
    }
  };
}
