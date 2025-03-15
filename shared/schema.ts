import { mysqlTable, text, int, varchar, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User related schemas
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 255 }),
  bio: text("bio"),
  role: mysqlEnum("role", ['admin', 'moderator', 'user']).notNull().default('user'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define user relations
export const usersRelations = relations(users, ({ many }) => ({
  topics: many(topics),
  comments: many(comments),
  likes: many(likes),
}));

// Topic related schemas
export const topics = mysqlTable("topics", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: int("author_id").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  image: varchar("image", { length: 255 }),
  attachment: varchar("attachment", { length: 255 }),
  attachmentName: varchar("attachment_name", { length: 255 }),
  likesCount: int("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define topic relations
export const topicsRelations = relations(topics, ({ one, many }) => ({
  author: one(users, {
    fields: [topics.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

// Comment related schemas
export const comments = mysqlTable("comments", {
  id: int("id").primaryKey().autoincrement(),
  content: text("content").notNull(),
  authorId: int("author_id").notNull().references(() => users.id),
  topicId: int("topic_id").notNull().references(() => topics.id),
  likesCount: int("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define comment relations
export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [comments.topicId],
    references: [topics.id],
  }),
  likes: many(likes),
}));

// Likes related schemas
export const likes = mysqlTable("likes", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  topicId: int("topic_id").references(() => topics.id),
  commentId: int("comment_id").references(() => comments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define likes relations
export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [likes.topicId],
    references: [topics.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const userLoginSchema = z.object({
  email: z.string().email("Требуется действительный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  title: true,
  content: true,
  category: true,
}).extend({
  image: z.string().optional(),
  attachment: z.string().optional(),
  attachmentName: z.string().optional(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  topicId: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  topicId: true,
  commentId: true,
});

// Role types
export const UserRole = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema> & { authorId: number };

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema> & { authorId: number };

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema> & { userId: number };

// Category enumeration
export const topicCategories = [
  "Общие обсуждения",
  "Новости",
  "Вопросы",
  "Идеи и предложения",
];