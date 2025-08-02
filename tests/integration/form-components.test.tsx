import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createRemixStub } from '@remix-run/testing';
import { json } from '@remix-run/node';
import PostForm from '~/components/PostForm';
import CommentForm from '~/components/CommentForm';
import LoginForm from '~/components/LoginForm';
import RegisterForm from '~/components/RegisterForm';

vi.mock('~/lib/auth/session', () => ({
  getUserSession: vi.fn(),
}));

vi.mock('~/lib/db/connection', () => ({
  getPosts: vi.fn(),
  createPost: vi.fn(),
  createComment: vi.fn(),
}));

describe('Form Components Integration', () => {
  describe('PostForm', () => {
    it('should submit post form successfully', async () => {
      const mockAction = vi.fn().mockResolvedValue(json({ success: true }));
      
      const RemixStub = createRemixStub([
        {
          path: '/posts/new',
          Component: PostForm,
          action: mockAction,
        },
      ]);

      const { container } = render(
        <RemixStub initialEntries={['/posts/new']} />
      );

      const titleInput = screen.getByLabelText('Title');
      const contentTextarea = screen.getByLabelText('Content');
      const submitButton = screen.getByText('Create Post');

      fireEvent.change(titleInput, { target: { value: 'Test Post' } });
      fireEvent.change(contentTextarea, { target: { value: 'Test content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(
          expect.objectContaining({
            request: expect.any(Request),
          })
        );
      });
    });

    it('should show validation errors', async () => {
      const mockAction = vi.fn().mockResolvedValue(
        json({ errors: { title: 'Title is required' } }, { status: 400 })
      );
      
      const RemixStub = createRemixStub([
        {
          path: '/posts/new',
          Component: PostForm,
          action: mockAction,
        },
      ]);

      render(<RemixStub initialEntries={['/posts/new']} />);

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('should handle form loading states', async () => {
      const mockAction = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(json({ success: true })), 100))
      );
      
      const RemixStub = createRemixStub([
        {
          path: '/posts/new',
          Component: PostForm,
          action: mockAction,
        },
      ]);

      render(<RemixStub initialEntries={['/posts/new']} />);

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      expect(screen.getByText('Creating...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
      });
    });
  });

  describe('CommentForm', () => {
    it('should submit comment with postId', async () => {
      const mockAction = vi.fn().mockResolvedValue(json({ success: true }));
      
      const RemixStub = createRemixStub([
        {
          path: '/posts/:postId/comments',
          Component: CommentForm,
          action: mockAction,
        },
      ]);

      render(
        <RemixStub initialEntries={['/posts/123/comments']} />
      );

      const contentTextarea = screen.getByLabelText('Comment');
      const submitButton = screen.getByText('Post Comment');

      fireEvent.change(contentTextarea, { target: { value: 'Great post!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { postId: '123' },
          })
        );
      });
    });
  });

  describe('LoginForm', () => {
    it('should submit login credentials', async () => {
      const mockAction = vi.fn().mockResolvedValue(json({ success: true }));
      
      const RemixStub = createRemixStub([
        {
          path: '/login',
          Component: LoginForm,
          action: mockAction,
        },
      ]);

      render(<RemixStub initialEntries={['/login']} />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
      });
    });

    it('should show authentication errors', async () => {
      const mockAction = vi.fn().mockResolvedValue(
        json({ errors: { general: 'Invalid credentials' } }, { status: 401 })
      );
      
      const RemixStub = createRemixStub([
        {
          path: '/login',
          Component: LoginForm,
          action: mockAction,
        },
      ]);

      render(<RemixStub initialEntries={['/login']} />);

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('RegisterForm', () => {
    it('should validate password confirmation', async () => {
      const mockAction = vi.fn().mockResolvedValue(json({ success: true }));
      
      const RemixStub = createRemixStub([
        {
          path: '/register',
          Component: RegisterForm,
          action: mockAction,
        },
      ]);

      render(<RemixStub initialEntries={['/register']} />);

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByText('Register');

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'different' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const mockAction = vi.fn().mockResolvedValue(json({ success: true }));
      
      const RemixStub = createRemixStub([
        {
          path: '/register',
          Component: RegisterForm,
          action: mockAction,
        },
      ]);

      render(<RemixStub initialEntries={['/register']} />);

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByText('Register');

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const RemixStub = createRemixStub([
        {
          path: '/posts/new',
          Component: PostForm,
        },
      ]);

      render(<RemixStub initialEntries={['/posts/new']} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toHaveAttribute('required');
      expect(screen.getByLabelText('Content')).toHaveAttribute('required');
    });

    it('should handle keyboard navigation', () => {
      const RemixStub = createRemixStub([
        {
          path: '/posts/new',
          Component: PostForm,
        },
      ]);

      render(<RemixStub initialEntries={['/posts/new']} />);

      const titleInput = screen.getByLabelText('Title');
      const contentTextarea = screen.getByLabelText('Content');
      const submitButton = screen.getByText('Create Post');

      titleInput.focus();
      expect(document.activeElement).toBe(titleInput);

      fireEvent.keyDown(titleInput, { key: 'Tab' });
      expect(document.activeElement).toBe(contentTextarea);
    });
  });
});