import { test, expect } from '@playwright/test';
import { createUser, createPost, createComment } from '../helpers/test-data';

test.describe('User Registration Flow', () => {
  test('should complete full registration process', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify user is logged in
    await expect(page.locator('h1')).toContainText('Welcome, newuser');
    
    // Check session persistence
    await page.reload();
    await expect(page.locator('h1')).toContainText('Welcome, newuser');
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('.error-email')).toContainText('Email is required');
    await expect(page.locator('.error-username')).toContainText('Username is required');
    await expect(page.locator('.error-password')).toContainText('Password is required');
    
    // Test invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-email')).toContainText('Invalid email format');
    
    // Test password mismatch
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'different');
    await expect(page.locator('.error-confirmPassword')).toContainText('Passwords do not match');
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // Create existing user
    await createUser({ email: 'existing@example.com', username: 'existinguser' });
    
    await page.goto('/register');
    
    // Try to register with existing email
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-general')).toContainText('Email already exists');
  });
});

test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });
    
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/dashboard');
    
    // Verify login success
    await expect(page.locator('h1')).toContainText('Welcome, testuser');
    await expect(page.locator('.user-menu')).toContainText('testuser');
  });

  test('should handle login errors gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-general')).toContainText('Invalid email or password');
    
    // Verify form is not cleared
    await expect(page.locator('input[name="email"]')).toHaveValue('invalid@example.com');
  });

  test('should logout successfully', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser'
    });
    
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Logout
    await page.click('button[name="logout"]');
    
    // Verify logout
    await page.waitForURL('/');
    await expect(page.locator('.login-link')).toBeVisible();
    await expect(page.locator('.user-menu')).not.toBeVisible();
  });
});

test.describe('Post Creation Flow', () => {
  test('should create new post', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser'
    });
    
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to create post
    await page.goto('/posts/new');
    
    // Fill post form
    await page.fill('input[name="title"]', 'My First Post');
    await page.fill('textarea[name="content"]', 'This is the content of my first post.');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify post creation
    await page.waitForURL(/\/posts\/[\w-]+/);
    await expect(page.locator('h1')).toContainText('My First Post');
    await expect(page.locator('.post-content')).toContainText('This is the content');
    await expect(page.locator('.post-author')).toContainText('testuser');
  });

  test('should validate post creation form', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser'
    });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/posts/new');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-title')).toContainText('Title is required');
    await expect(page.locator('.error-content')).toContainText('Content is required');
  });

  test('should handle post creation errors', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser'
    });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/posts/new');
    
    // Fill form with very long title
    await page.fill('input[name="title"]', 'a'.repeat(300));
    await page.fill('textarea[name="content"]', 'Content');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-title')).toContainText('Title is too long');
  });
});

test.describe('Comment Flow', () => {
  test('should add comment to post', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser'
    });
    const post = await createPost({
      title: 'Test Post',
      content: 'Test content',
      authorId: user.id
    });
    
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to post
    await page.goto(`/posts/${post.id}`);
    
    // Add comment
    await page.fill('textarea[name="content"]', 'This is a great post!');
    await page.click('button[name="add-comment"]');
    
    // Verify comment appears
    await expect(page.locator('.comments')).toContainText('This is a great post!');
    await expect(page.locator('.comment-author')).toContainText('testuser');
  });

  test('should show comment count', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser'
    });
    const post = await createPost({
      title: 'Test Post',
      content: 'Test content',
      authorId: user.id
    });
    
    await createComment({
      content: 'First comment',
      postId: post.id,
      authorId: user.id
    });
    
    await createComment({
      content: 'Second comment',
      postId: post.id,
      authorId: user.id
    });
    
    await page.goto(`/posts/${post.id}`);
    
    await expect(page.locator('.comment-count')).toContainText('2 comments');
  });

  test('should prevent empty comments', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser'
    });
    const post = await createPost({
      title: 'Test Post',
      content: 'Test content',
      authorId: user.id
    });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto(`/posts/${post.id}`);
    
    // Try to submit empty comment
    await page.click('button[name="add-comment"]');
    
    await expect(page.locator('.error-content')).toContainText('Comment is required');
  });
});

test.describe('User Profile Flow', () => {
  test('should view user profile', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser',
      bio: 'Test user bio'
    });
    
    await createPost({
      title: 'User Post 1',
      content: 'Content 1',
      authorId: user.id
    });
    
    await createPost({
      title: 'User Post 2',
      content: 'Content 2',
      authorId: user.id
    });
    
    await page.goto('/profile/testuser');
    
    await expect(page.locator('h1')).toContainText('testuser');
    await expect(page.locator('.user-bio')).toContainText('Test user bio');
    await expect(page.locator('.post-count')).toContainText('2 posts');
    
    // Verify posts are displayed
    const posts = page.locator('.user-post');
    await expect(posts).toHaveCount(2);
    await expect(posts.first()).toContainText('User Post 1');
    await expect(posts.last()).toContainText('User Post 2');
  });

  test('should handle non-existent user', async ({ page }) => {
    await page.goto('/profile/nonexistent');
    
    await expect(page.locator('h1')).toContainText('User not found');
    await expect(page.locator('.error-message')).toContainText('The user you are looking for does not exist');
  });
});

test.describe('Navigation Flow', () => {
  test('should navigate between pages', async ({ page }) => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser'
    });
    
    await createPost({
      title: 'Navigation Test Post',
      content: 'Content for navigation test',
      authorId: user.id
    });
    
    await page.goto('/');
    
    // Navigate to posts
    await page.click('a[href="/posts"]');
    await expect(page).toHaveURL('/posts');
    
    // Click on post
    await page.click('.post-link');
    await expect(page).toHaveURL(/\/posts\/[\w-]+/);
    
    // Navigate back
    await page.goBack();
    await expect(page).toHaveURL('/posts');
    
    // Navigate to login
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
  });

  test('should maintain scroll position on navigation', async ({ page }) => {
    // Create multiple posts to enable scrolling
    for (let i = 0; i < 20; i++) {
      await createPost({
        title: `Post ${i}`,
        content: `Content for post ${i}`,
        authorId: '1'
      });
    }
    
    await page.goto('/posts');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    const scrollPosition = await page.evaluate(() => window.scrollY);
    
    // Navigate to post and back
    await page.click('.post-link');
    await page.goBack();
    
    // Check if scroll position is maintained
    const newScrollPosition = await page.evaluate(() => window.scrollY);
    expect(newScrollPosition).toBeGreaterThan(0);
  });
});