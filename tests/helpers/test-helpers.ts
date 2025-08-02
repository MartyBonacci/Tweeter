import { createCookieSessionStorage } from '@remix-run/node';

export interface MockRequestOptions {
  method?: string;
  url?: string;
  formData?: FormData;
  headers?: Record<string, string>;
  body?: string;
}

export function createMockRequest(options: MockRequestOptions = {}): Request {
  const {
    method = 'GET',
    url = 'http://localhost:3000',
    formData,
    headers = {},
    body,
  } = options;

  let requestBody: string | FormData = '';
  let contentType = headers['content-type'] || 'application/json';

  if (formData) {
    requestBody = formData;
    contentType = 'multipart/form-data';
  } else if (body) {
    requestBody = body;
  } else if (method !== 'GET' && method !== 'HEAD') {
    requestBody = '{}';
  }

  return new Request(url, {
    method,
    headers: {
      'content-type': contentType,
      ...headers,
    },
    body: requestBody,
  });
}

export function createMockContext(user?: any) {
  return {
    user,
    session: createCookieSessionStorage({
      cookie: {
        name: '__session',
        secrets: ['test-secret'],
        sameSite: 'lax',
        path: '/',
        httpOnly: true,
        secure: false,
      },
    }),
  };
}

export function createMockFormData(data: Record<string, string | File>): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return formData;
}

export function createMockCookies(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('; ');
}

export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

export function createTestUser(overrides = {}) {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createTestPost(overrides = {}) {
  return {
    id: 'test-post-123',
    title: 'Test Post',
    content: 'This is a test post content.',
    authorId: 'test-user-123',
    author: createTestUser(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    published: true,
    likes: 0,
    commentCount: 0,
    ...overrides,
  };
}

export function createTestComment(overrides = {}) {
  return {
    id: 'test-comment-123',
    content: 'This is a test comment.',
    authorId: 'test-user-456',
    author: createTestUser({ id: 'test-user-456', username: 'commenter' }),
    postId: 'test-post-123',
    post: createTestPost(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    likes: 0,
    replies: [],
    ...overrides,
  };
}

export function mockApiResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

export function mockApiError(message: string, status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(message),
  });
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function generateRandomEmail(): string {
  return `test${generateRandomId()}@example.com`;
}

export function generateRandomUsername(): string {
  return `user${generateRandomId()}`;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}