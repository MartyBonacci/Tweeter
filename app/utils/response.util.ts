import { json } from '@react-router/node';

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
};

export class ResponseUtil {
  static success<T>(data: T, status = 200) {
    return json<ApiResponse<T>>({ success: true, data }, { status });
  }

  static error(message: string, status = 400, details?: unknown) {
    return json<ApiResponse>({ success: false, error: message, details }, { status });
  }

  static validationError(errors: unknown) {
    return this.error('Validation failed', 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  static notFound(message = 'Resource not found') {
    return this.error(message, 404);
  }

  static serverError(message = 'Internal server error') {
    return this.error(message, 500);
  }

  static created<T>(data: T) {
    return this.success(data, 201);
  }

  static withCookies<T>(response: Response, cookies: string[]) {
    const headers = new Headers(response.headers);
    cookies.forEach(cookie => headers.append('Set-Cookie', cookie));
    return new Response(response.body, { ...response, headers });
  }
}