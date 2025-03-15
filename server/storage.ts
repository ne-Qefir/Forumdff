import { users, topics, comments, likes, UserRole, User, InsertUser, Topic, InsertTopic, Comment, InsertComment, Like, InsertLike } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, poolConnection } from "./db";
import { eq, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: typeof UserRole[keyof typeof UserRole]): Promise<User | undefined>;

  // Topic operations
  createTopic(topic: InsertTopic): Promise<Topic>;
  getTopic(id: number): Promise<Topic | undefined>;
  getAllTopics(): Promise<Topic[]>;
  getTopicsByAuthor(authorId: number): Promise<Topic[]>;
  getTopicsByCategory(category: string): Promise<Topic[]>;
  updateTopicLikesCount(id: number, increment: boolean): Promise<void>;

  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByTopic(topicId: number): Promise<Comment[]>;
  updateCommentLikesCount(id: number, increment: boolean): Promise<void>;

  // Like operations
  createLike(like: InsertLike): Promise<Like>;
  removeLike(userId: number, topicId?: number, commentId?: number): Promise<void>;
  getLikesByUser(userId: number): Promise<Like[]>;
  getLikesByTopic(topicId: number): Promise<Like[]>;
  getLikesByComment(commentId: number): Promise<Like[]>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const [result] = await poolConnection.execute(
      'INSERT INTO users (username, email, password, role, avatar, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [
        user.username || '',
        user.email || '',
        user.password || '',
        user.role || UserRole.USER,
        user.avatar || '',
        user.bio || ''
      ]
    );
    const newUser = await this.getUser((result as any).insertId);
    if (!newUser) throw new Error('Failed to create user');
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await poolConnection.execute(
      `UPDATE users SET ${fields} WHERE id = ?`,
      [...values, id]
    );

    return this.getUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUserRole(id: number, role: typeof UserRole[keyof typeof UserRole]): Promise<User | undefined> {
    return this.updateUser(id, { role });
  }

  // Topic operations
  async createTopic(topic: InsertTopic): Promise<Topic> {
    try {
      const [result] = await poolConnection.execute(
        `INSERT INTO topics 
         (title, content, author_id, category, image, attachment, attachment_name, likes_count) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          topic.title,
          topic.content,
          topic.authorId,
          topic.category,
          topic.image || null,
          topic.attachment || null,
          topic.attachmentName || null,
          0 // начальное значение для likes_count
        ]
      );

      if (!result || !(result as any).insertId) {
        throw new Error('Не удалось получить ID созданной темы');
      }

      const newTopic = await this.getTopic((result as any).insertId);
      if (!newTopic) {
        throw new Error('Не удалось найти созданную тему');
      }

      return newTopic;
    } catch (error: any) {
      console.error('Ошибка при создании темы:', error);
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new Error('Указанный автор не существует');
      }
      if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
        throw new Error('Не все обязательные поля заполнены');
      }
      if (error.code === 'ER_DATA_TOO_LONG') {
        throw new Error('Один из введенных текстов слишком длинный');
      }
      throw new Error(`Ошибка при создании темы: ${error.message}`);
    }
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async getAllTopics(): Promise<Topic[]> {
    return db.select()
      .from(topics)
      .orderBy(desc(topics.createdAt));
  }

  async getTopicsByAuthor(authorId: number): Promise<Topic[]> {
    return db.select()
      .from(topics)
      .where(eq(topics.authorId, authorId))
      .orderBy(desc(topics.createdAt));
  }

  async getTopicsByCategory(category: string): Promise<Topic[]> {
    return db.select()
      .from(topics)
      .where(eq(topics.category, category))
      .orderBy(desc(topics.createdAt));
  }

  async updateTopicLikesCount(id: number, increment: boolean): Promise<void> {
    await poolConnection.execute(
      'UPDATE topics SET likes_count = likes_count + ? WHERE id = ?',
      [increment ? 1 : -1, id]
    );
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [result] = await poolConnection.execute(
      'INSERT INTO comments (content, author_id, topic_id) VALUES (?, ?, ?)',
      [comment.content, comment.authorId, comment.topicId]
    );
    const [newComment] = await db.select()
      .from(comments)
      .where(eq(comments.id, (result as any).insertId));
    if (!newComment) throw new Error('Failed to create comment');
    return newComment;
  }

  async getCommentsByTopic(topicId: number): Promise<Comment[]> {
    return db.select()
      .from(comments)
      .where(eq(comments.topicId, topicId))
      .orderBy(desc(comments.createdAt));
  }

  async updateCommentLikesCount(id: number, increment: boolean): Promise<void> {
    await poolConnection.execute(
      'UPDATE comments SET likes_count = likes_count + ? WHERE id = ?',
      [increment ? 1 : -1, id]
    );
  }

  // Like operations
  async createLike(like: InsertLike): Promise<Like> {
    const [result] = await poolConnection.execute(
      'INSERT INTO likes (user_id, topic_id, comment_id) VALUES (?, ?, ?)',
      [like.userId, like.topicId || null, like.commentId || null]
    );

    if (like.topicId) {
      await this.updateTopicLikesCount(like.topicId, true);
    }
    if (like.commentId) {
      await this.updateCommentLikesCount(like.commentId, true);
    }

    const [newLike] = await db.select()
      .from(likes)
      .where(eq(likes.id, (result as any).insertId));
    if (!newLike) throw new Error('Failed to create like');
    return newLike;
  }

  async removeLike(userId: number, topicId?: number, commentId?: number): Promise<void> {
    if (topicId) {
      await poolConnection.execute(
        'DELETE FROM likes WHERE user_id = ? AND topic_id = ?',
        [userId, topicId]
      );
      await this.updateTopicLikesCount(topicId, false);
    }
    if (commentId) {
      await poolConnection.execute(
        'DELETE FROM likes WHERE user_id = ? AND comment_id = ?',
        [userId, commentId]
      );
      await this.updateCommentLikesCount(commentId, false);
    }
  }

  async getLikesByUser(userId: number): Promise<Like[]> {
    return db.select()
      .from(likes)
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt));
  }

  async getLikesByTopic(topicId: number): Promise<Like[]> {
    return db.select()
      .from(likes)
      .where(eq(likes.topicId, topicId))
      .orderBy(desc(likes.createdAt));
  }

  async getLikesByComment(commentId: number): Promise<Like[]> {
    return db.select()
      .from(likes)
      .where(eq(likes.commentId, commentId))
      .orderBy(desc(likes.createdAt));
  }
}

export const storage = new DatabaseStorage();