import { faker } from '@faker-js/faker';

export interface UserData {
  id: string;
  email: string;
  username: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
  bio?: string;
  avatar?: string;
}

export interface CreateUserOptions {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  avatar?: string;
}

export class UserFactory {
  static create(overrides: CreateUserOptions = {}): UserData {
    return {
      id: faker.string.uuid(),
      email: overrides.email || faker.internet.email(),
      username: overrides.username || faker.internet.userName().toLowerCase(),
      password: overrides.password || faker.internet.password({ length: 12 }),
      bio: overrides.bio || faker.lorem.sentence(),
      avatar: overrides.avatar || faker.image.avatarGitHub(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }

  static createMany(count: number, overrides: CreateUserOptions = {}): UserData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createValidRegistrationData() {
    const password = faker.internet.password({ length: 12 });
    return {
      email: faker.internet.email(),
      username: faker.internet.userName().toLowerCase(),
      password,
      confirmPassword: password,
    };
  }

  static createLoginData(user: UserData) {
    return {
      email: user.email,
      password: user.password!,
    };
  }
}