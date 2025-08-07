import { db } from '~/lib/db/connection';
import { AppError, NotFoundError } from '~/utils/error.util';

export interface BaseServiceOptions {
  tableName: string;
  primaryKey?: string;
}

export abstract class BaseService<T> {
  constructor(protected tableName: string, protected primaryKey = 'id') {}

  protected async findById(id: string): Promise<T | null> {
    try {
      const result = await db.select()
        .from(this.tableName as any)
        .where({ [this.primaryKey]: id } as any)
        .limit(1);
      
      return result[0] as T || null;
    } catch (error) {
      throw new AppError(`Failed to find ${this.tableName}: ${error}`);
    }
  }

  protected async findAll(limit = 50, offset = 0): Promise<T[]> {
    try {
      return await db.select()
        .from(this.tableName as any)
        .limit(limit)
        .offset(offset) as T[];
    } catch (error) {
      throw new AppError(`Failed to find all ${this.tableName}: ${error}`);
    }
  }

  protected async create(data: Partial<T>): Promise<T> {
    try {
      const result = await db.insert(this.tableName as any)
        .values(data as any)
        .returning() as T[];
      
      return result[0];
    } catch (error) {
      throw new AppError(`Failed to create ${this.tableName}: ${error}`);
    }
  }

  protected async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const result = await db.update(this.tableName as any)
        .set(data as any)
        .where({ [this.primaryKey]: id } as any)
        .returning() as T[];
      
      if (result.length === 0) {
        throw new NotFoundError(this.tableName);
      }
      
      return result[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to update ${this.tableName}: ${error}`);
    }
  }

  protected async delete(id: string): Promise<void> {
    try {
      const result = await db.delete(this.tableName as any)
        .where({ [this.primaryKey]: id } as any);
      
      if (result.count === 0) {
        throw new NotFoundError(this.tableName);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to delete ${this.tableName}: ${error}`);
    }
  }
}