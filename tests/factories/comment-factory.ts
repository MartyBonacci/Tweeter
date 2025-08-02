import { faker } from '@faker-js/faker';
import { UserData } from './user-factory';
import { PostData } from './post-factory';

export interface CommentData {
  id: string;
  content: string;
  authorId: string;
  author: UserData;
  postId: string;
  post: PostData;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  replies: CommentData[];
  parentId?: string;
}

export interface CreateCommentOptions {
  content?: string;
  authorId?: string;
  author?: UserData;
  postId?: string;
  post?: PostData;
  likes?: number;
  replies?: CommentData[];
  parentId?: string;
}

export class CommentFactory {
  static create(
    author: UserData,
    post: PostData,
    overrides: CreateCommentOptions = {}
  ): CommentData {
    return {
      id: faker.string.uuid(),
      content: overrides.content || faker.lorem.sentence(),
      authorId: overrides.authorId || author.id,
      author: overrides.author || author,
      postId: overrides.postId || post.id,
      post: overrides.post || post,
      createdAt: overrides.createdAt || faker.date.past(),
      updatedAt: overrides.updatedAt || faker.date.recent(),
      likes: overrides.likes ?? faker.number.int({ min: 0, max: 20 }),
      replies: overrides.replies || [],
      parentId: overrides.parentId,
    };
  }

  static createMany(
    author: UserData,
    post: PostData,
    count: number,
    overrides: CreateCommentOptions = {}
  ): CommentData[] {
    return Array.from({ length: count }, () => this.create(author, post, overrides));
  }

  static createThread(
    author: UserData,
    post: PostData,
    replyCount: number = 2
  ): { parent: CommentData; replies: CommentData[] } {
    const parent = this.create(author, post);
    const replies = Array.from({ length: replyCount }, () => this.create(author, post, { parentId: parent.id })
    );

    return { parent, replies };
  }

  static createNestedComment(
    author: UserData,
    post: PostData,
    parentComment: CommentData
  ): CommentData {
    return this.create(author, post, {
      parentId: parentComment.id,
      content: `Reply to @${parentComment.author.username}: ${faker.lorem.sentence()}`,
    });
  }

  static createPopularComment(author: UserData, post: PostData): CommentData {
    return this.create(author, post, {
      likes: faker.number.int({ min: 10, max: 100 }),
      content: faker.lorem.paragraph(),
    });
  }

  static createRecentComment(author: UserData, post: PostData): CommentData {
    return this.create(author, post, {
      createdAt: faker.date.recent({ days: 1 }),
      updatedAt: faker.date.recent({ days: 1 }),
    });
  }

  static createLongComment(author: UserData, post: PostData): CommentData {
    return this.create(author, post, {
      content: faker.lorem.paragraphs(3),
    });
  }

  static createMentionComment(
    author: UserData,
    post: PostData,
    mentionedUser: UserData
  ): CommentData {
    return this.create(author, post, {
      content: `Hey @${mentionedUser.username}, ${faker.lorem.sentence()}`,
    });
  }
}