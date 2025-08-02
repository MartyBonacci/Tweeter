import { faker } from '@faker-js/faker';
import { UserData } from './user-factory';

export interface PostData {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: UserData;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  tags?: string[];
  likes: number;
  commentCount: number;
}

export interface CreatePostOptions {
  title?: string;
  content?: string;
  authorId?: string;
  author?: UserData;
  published?: boolean;
  tags?: string[];
  likes?: number;
  commentCount?: number;
}

export class PostFactory {
  static create(author: UserData, overrides: CreatePostOptions = {}): PostData {
    return {
      id: faker.string.uuid(),
      title: overrides.title || faker.lorem.sentence(),
      content: overrides.content || faker.lorem.paragraphs(3),
      authorId: overrides.authorId || author.id,
      author: overrides.author || author,
      createdAt: overrides.createdAt || faker.date.past(),
      updatedAt: overrides.updatedAt || faker.date.recent(),
      published: overrides.published ?? true,
      tags: overrides.tags || [faker.word.sample(), faker.word.sample()],
      likes: overrides.likes ?? faker.number.int({ min: 0, max: 100 }),
      commentCount: overrides.commentCount ?? faker.number.int({ min: 0, max: 50 }),
    };
  }

  static createMany(author: UserData, count: number, overrides: CreatePostOptions = {}): PostData[] {
    return Array.from({ length: count }, () => this.create(author, overrides));
  }

  static createWithComments(author: UserData, commentCount: number = 3): PostData {
    const post = this.create(author, { commentCount });
    return post;
  }

  static createDraft(author: UserData, overrides: CreatePostOptions = {}): PostData {
    return this.create(author, { ...overrides, published: false });
  }

  static createPopular(author: UserData): PostData {
    return this.create(author, {
      likes: faker.number.int({ min: 50, max: 1000 }),
      commentCount: faker.number.int({ min: 20, max: 100 }),
    });
  }

  static createRecent(author: UserData): PostData {
    return this.create(author, {
      createdAt: faker.date.recent({ days: 1 }),
      updatedAt: faker.date.recent({ days: 1 }),
    });
  }

  static createLongForm(author: UserData): PostData {
    return this.create(author, {
      title: faker.lorem.sentence(10),
      content: faker.lorem.paragraphs(10),
    });
  }
}