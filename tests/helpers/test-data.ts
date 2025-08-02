import { UserFactory } from '../factories/user-factory';
import { PostFactory } from '../factories/post-factory';
import { CommentFactory } from '../factories/comment-factory';
import { UserData } from '../factories/user-factory';
import { PostData } from '../factories/post-factory';
import { CommentData } from '../factories/comment-factory';

export interface TestData {
  users: UserData[];
  posts: PostData[];
  comments: CommentData[];
}

export class TestDataBuilder {
  private users: UserData[] = [];
  private posts: PostData[] = [];
  private comments: CommentData[] = [];

  static create(): TestDataBuilder {
    return new TestDataBuilder();
  }

  withUsers(count: number, overrides = {}): this {
    this.users = [...this.users, ...UserFactory.createMany(count, overrides)];
    return this;
  }

  withUser(overrides = {}): this {
    this.users.push(UserFactory.create(overrides));
    return this;
  }

  withPosts(count: number, overrides = {}): this {
    if (this.users.length === 0) {
      this.withUser();
    }
    const author = this.users[0];
    this.posts = [...this.posts, ...PostFactory.createMany(author, count, overrides)];
    return this;
  }

  withPost(overrides = {}): this {
    if (this.users.length === 0) {
      this.withUser();
    }
    const author = this.users[0];
    this.posts.push(PostFactory.create(author, overrides));
    return this;
  }

  withComments(count: number, overrides = {}): this {
    if (this.posts.length === 0) {
      this.withPost();
    }
    if (this.users.length < 2) {
      this.withUser();
    }
    
    const post = this.posts[0];
    const author = this.users[1];
    this.comments = [...this.comments, ...CommentFactory.createMany(author, post, count, overrides)];
    return this;
  }

  withComment(overrides = {}): this {
    if (this.posts.length === 0) {
      this.withPost();
    }
    if (this.users.length < 2) {
      this.withUser();
    }
    
    const post = this.posts[0];
    const author = this.users[1];
    this.comments.push(CommentFactory.create(author, post, overrides));
    return this;
  }

  withComplexThread(): this {
    if (this.users.length < 3) {
      this.withUsers(3);
    }
    
    const author1 = this.users[0];
    const author2 = this.users[1];
    const author3 = this.users[2];
    
    const post = PostFactory.create(author1);
    this.posts.push(post);
    
    const comment1 = CommentFactory.create(author2, post);
    this.comments.push(comment1);
    
    const reply1 = CommentFactory.createNestedComment(author3, post, comment1);
    this.comments.push(reply1);
    
    const reply2 = CommentFactory.createNestedComment(author1, post, comment1);
    this.comments.push(reply2);
    
    return this;
  }

  withPopularContent(): this {
    this.withUser({ username: 'popularuser' });
    const popularUser = this.users[this.users.length - 1];
    
    this.withPost(PostFactory.createPopular(popularUser));
    const popularPost = this.posts[this.posts.length - 1];
    
    this.withComments(50, CommentFactory.createPopularComment(popularUser, popularPost));
    
    return this;
  }

  build(): TestData {
    return {
      users: this.users,
      posts: this.posts,
      comments: this.comments,
    };
  }
}

// Convenience functions for quick test data creation
export async function createUser(overrides = {}): Promise<UserData> {
  const user = UserFactory.create(overrides);
  // In actual implementation, this would save to database
  return user;
}

export async function createPost(overrides = {}): Promise<PostData> {
  const user = await createUser();
  const post = PostFactory.create(user, overrides);
  // In actual implementation, this would save to database
  return post;
}

export async function createComment(overrides = {}): Promise<CommentData> {
  const user = await createUser();
  const post = await createPost();
  const comment = CommentFactory.create(user, post, overrides);
  // In actual implementation, this would save to database
  return comment;
}

export function createFullTestData(): TestData {
  return TestDataBuilder.create()
    .withUsers(5)
    .withPosts(10)
    .withComments(25)
    .withComplexThread()
    .withPopularContent()
    .build();
}

export function createMinimalTestData(): TestData {
  return TestDataBuilder.create()
    .withUser()
    .withPost()
    .withComment()
    .build();
}

// Seed data for specific test scenarios
export const seedData = {
  users: {
    admin: UserFactory.create({
      email: 'admin@example.com',
      username: 'admin',
      bio: 'System administrator',
    }),
    regular: UserFactory.create({
      email: 'user@example.com',
      username: 'regularuser',
      bio: 'Regular system user',
    }),
  },
  
  posts: {
    welcome: (author: UserData) => PostFactory.create(author, {
      title: 'Welcome to Tweeter',
      content: 'This is a welcome post for new users.',
      tags: ['welcome', 'introduction'],
    }),
    tutorial: (author: UserData) => PostFactory.create(author, {
      title: 'How to use Tweeter',
      content: 'A comprehensive tutorial on using our platform.',
      tags: ['tutorial', 'guide'],
    }),
  },
};