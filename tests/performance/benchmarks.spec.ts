import { test, expect } from '@playwright/test';
import { createUser, createPost, createComment } from '../helpers/test-data';
import { UserFactory } from '../factories/user-factory';
import { PostFactory } from '../factories/post-factory';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  navigation: {
    home: 1000,
    posts: 1500,
    postDetail: 2000,
    profile: 1800,
  },
  api: {
    postsList: 500,
    postDetail: 400,
    userProfile: 600,
    createPost: 800,
  },
  bundle: {
    maxSize: 500, // KB
    jsSize: 300,
    cssSize: 50,
  },
  lighthouse: {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 95,
  },
};

test.describe('Performance Benchmarks', () => {
  test('should load home page within threshold', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.navigation.home);
    
    // Check for core web vitals
    const metrics = await page.evaluate(() => {
      return {
        lcp: performance.getEntriesByType('navigation')[0]?.loadEventEnd || 0,
        fid: performance.getEntriesByType('first-input')[0]?.startTime || 0,
        cls: 0, // Would need to be calculated
      };
    });
    
    expect(metrics.lcp).toBeLessThan(2500);
  });

  test('should load posts list efficiently', async ({ page }) => {
    // Create test data
    const user = await createUser();
    for (let i = 0; i < 50; i++) {
      await createPost({ authorId: user.id });
    }
    
    const startTime = Date.now();
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.navigation.posts);
    
    // Check for lazy loading
    const initialPosts = await page.locator('.post-item').count();
    expect(initialPosts).toBeGreaterThan(0);
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const postsAfterScroll = await page.locator('.post-item').count();
    expect(postsAfterScroll).toBeGreaterThanOrEqual(initialPosts);
  });

  test('should handle post detail page efficiently', async ({ page }) => {
    const user = await createUser();
    const post = await createPost({ authorId: user.id });
    
    // Add comments to test rendering performance
    for (let i = 0; i < 100; i++) {
      await createComment({ postId: post.id, authorId: user.id });
    }
    
    const startTime = Date.now();
    await page.goto(`/posts/${post.id}`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.navigation.postDetail);
    
    // Check comment rendering performance
    const comments = await page.locator('.comment').count();
    expect(comments).toBe(100);
  });

  test('should profile page load efficiently', async ({ page }) => {
    const user = await createUser();
    
    // Create multiple posts for user
    for (let i = 0; i < 25; i++) {
      await createPost({ authorId: user.id });
    }
    
    const startTime = Date.now();
    await page.goto(`/profile/${user.username}`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.navigation.profile);
  });
});

test.describe('API Performance', () => {
  test('should fetch posts list quickly', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/posts');
    const apiTime = Date.now() - startTime;
    
    expect(response.ok()).toBeTruthy();
    expect(apiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.api.postsList);
    
    const data = await response.json();
    expect(Array.isArray(data.posts)).toBeTruthy();
  });

  test('should fetch post detail quickly', async ({ request }) => {
    const user = await createUser();
    const post = await createPost({ authorId: user.id });
    
    const startTime = Date.now();
    const response = await request.get(`/api/posts/${post.id}`);
    const apiTime = Date.now() - startTime;
    
    expect(response.ok()).toBeTruthy();
    expect(apiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.api.postDetail);
  });

  test('should fetch user profile quickly', async ({ request }) => {
    const user = await createUser();
    
    const startTime = Date.now();
    const response = await request.get(`/api/users/${user.username}`);
    const apiTime = Date.now() - startTime;
    
    expect(response.ok()).toBeTruthy();
    expect(apiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.api.userProfile);
  });

  test('should create post quickly', async ({ request }) => {
    const user = await createUser();
    
    // First login to get session
    await request.post('/api/auth/login', {
      data: {
        email: user.email,
        password: 'password123' // Assuming this is set during user creation
      }
    });
    
    const startTime = Date.now();
    const response = await request.post('/api/posts', {
      data: {
        title: 'Performance Test Post',
        content: 'This is a performance test post content.'
      }
    });
    const apiTime = Date.now() - startTime;
    
    expect(response.ok()).toBeTruthy();
    expect(apiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.api.createPost);
  });
});

test.describe('Bundle Size Analysis', () => {
  test('should have acceptable bundle size', async ({ page }) => {
    await page.goto('/');
    
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('.js') || entry.name.includes('.css'))
        .reduce((acc, entry) => {
          const type = entry.name.includes('.js') ? 'js' : 'css';
          acc[type] = (acc[type] || 0) + entry.transferSize;
          return acc;
        }, {} as Record<string, number>);
    });
    
    const totalSize = Object.values(resources).reduce((sum, size) => sum + size, 0) / 1024;
    const jsSize = (resources.js || 0) / 1024;
    const cssSize = (resources.css || 0) / 1024;
    
    expect(totalSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundle.maxSize);
    expect(jsSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundle.jsSize);
    expect(cssSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundle.cssSize);
  });

  test('should lazy load components', async ({ page }) => {
    await page.goto('/');
    
    // Check for code splitting indicators
    const hasCodeSplitting = await page.evaluate(() => {
      return document.querySelectorAll('script[src*="chunk"]').length > 0;
    });
    
    expect(hasCodeSplitting).toBeTruthy();
  });
});

test.describe('Lighthouse Performance', () => {
  test('should meet performance standards', async ({ page }) => {
    await page.goto('/');
    
    // This would typically use lighthouse-ci in CI/CD
    // For now, we'll check basic performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      };
    });
    
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000);
    expect(performanceMetrics.loadComplete).toBeLessThan(2000);
    expect(performanceMetrics.firstPaint).toBeLessThan(1000);
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check for accessibility best practices
    const hasLangAttribute = await page.evaluate(() => {
      return document.documentElement.hasAttribute('lang');
    });
    
    const hasMetaViewport = await page.evaluate(() => {
      return document.querySelector('meta[name="viewport"]') !== null;
    });
    
    const hasAltAttributes = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).every(img => img.hasAttribute('alt'));
    });
    
    expect(hasLangAttribute).toBeTruthy();
    expect(hasMetaViewport).toBeTruthy();
    expect(hasAltAttributes).toBeTruthy();
  });
});

test.describe('Database Query Performance', () => {
  test('should handle large dataset efficiently', async ({ page }) => {
    // Create large dataset
    const users = [];
    for (let i = 0; i < 100; i++) {
      users.push(await createUser({ username: `user${i}` }));
    }
    
    for (let i = 0; i < 1000; i++) {
      const user = users[i % users.length];
      await createPost({ authorId: user.id });
    }
    
    const startTime = Date.now();
    await page.goto('/posts?page=1');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
    
    // Test pagination
    await page.click('a[href="?page=2"]');
    await page.waitForLoadState('networkidle');
    
    const page2LoadTime = Date.now() - startTime;
    expect(page2LoadTime).toBeLessThan(2000);
  });

  test('should handle concurrent requests', async ({ page }) => {
    const user = await createUser();
    const posts = [];
    
    for (let i = 0; i < 10; i++) {
      posts.push(await createPost({ authorId: user.id }));
    }
    
    const startTime = Date.now();
    
    // Open multiple tabs concurrently
    const tabs = [];
    for (let i = 0; i < 5; i++) {
      const tab = await page.context().newPage();
      tabs.push(tab.goto(`/posts/${posts[i].id}`));
    }
    
    await Promise.all(tabs);
    
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(5000);
  });
});

test.describe('Memory Usage', () => {
  test('should not leak memory on navigation', async ({ page }) => {
    await page.goto('/');
    
    const initialMemory = await page.evaluate(() => {
      return performance.memory.usedJSHeapSize;
    });
    
    // Navigate through multiple pages
    for (let i = 0; i < 20; i++) {
      await page.goto('/posts');
      await page.goto('/');
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    const finalMemory = await page.evaluate(() => {
      return performance.memory.usedJSHeapSize;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
    
    expect(memoryIncreaseMB).toBeLessThan(50); // Less than 50MB increase
  });
});