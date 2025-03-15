import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupMulter } from "./multer";
import { z } from "zod";
import { UserRole, insertTopicSchema } from "@shared/schema";
import { db } from "./db";
import * as path from 'path';
import * as fs from 'fs';

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Требуется авторизация" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === UserRole.ADMIN) {
    return next();
  }
  res.status(403).json({ message: "Доступ запрещен" });
};

// Middleware to check if user is admin or moderator
const isAdminOrModerator = (req: Request, res: Response, next: Function) => {
  if (
    req.isAuthenticated() &&
    (req.user.role === UserRole.ADMIN || req.user.role === UserRole.MODERATOR)
  ) {
    return next();
  }
  res.status(403).json({ message: "Доступ запрещен" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Test route for database connection and tables creation
  app.get("/api/test-db", async (_req, res) => {
    try {
      const pool = (db as any).connection;

      // First, let's check what tables currently exist
      console.log('Checking existing tables...');
      const [existingTables] = await pool.execute('SHOW TABLES');
      console.log('Current tables:', existingTables.map((row: any) => Object.values(row)[0]));

      // Create users table
      console.log('Creating users table...');
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          avatar VARCHAR(255),
          bio TEXT,
          role ENUM('admin', 'moderator', 'user') NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created or already exists');

      // Create topics table with attachment fields
      console.log('Creating topics table...');
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS topics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          author_id INT NOT NULL,
          category VARCHAR(100) NOT NULL,
          image VARCHAR(255),
          attachment VARCHAR(255),
          attachment_name VARCHAR(255),
          likes_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users(id)
        )
      `);
      console.log('Topics table created or already exists');

      // Create comments table
      console.log('Creating comments table...');
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          content TEXT NOT NULL,
          author_id INT NOT NULL,
          topic_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users(id),
          FOREIGN KEY (topic_id) REFERENCES topics(id)
        )
      `);
      console.log('Comments table created or already exists');

      // Check final state of tables
      console.log('Checking final state of tables...');
      const [tables] = await pool.execute('SHOW TABLES');
      console.log('Final table list:', tables.map((row: any) => Object.values(row)[0]));

      res.json({
        message: "База данных успешно инициализирована",
        tables: tables.map((row: any) => Object.values(row)[0])
      });
    } catch (error) {
      console.error("Database initialization error:", error);
      res.status(500).json({
        message: "Ошибка при инициализации базы данных",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // Set up multer for file uploads
  const upload = setupMulter();

  // Get all topics
  app.get("/api/topics", async (req, res) => {
    try {
      const topics = await storage.getAllTopics();

      // Get author details for each topic
      const topicsWithAuthors = await Promise.all(
        topics.map(async (topic) => {
          const author = await storage.getUser(topic.authorId);
          return {
            ...topic,
            author: author ? {
              id: author.id,
              username: author.username,
              role: author.role,
              avatar: author.avatar,
            } : null,
          };
        })
      );

      res.json(topicsWithAuthors);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении тем" });
    }
  });

  // Get a specific topic
  app.get("/api/topics/:id", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const topic = await storage.getTopic(topicId);

      if (!topic) {
        return res.status(404).json({ message: "Тема не найдена" });
      }

      const author = await storage.getUser(topic.authorId);
      const comments = await storage.getCommentsByTopic(topicId);

      // Get author details for each comment
      const commentsWithAuthors = await Promise.all(
        comments.map(async (comment) => {
          const commentAuthor = await storage.getUser(comment.authorId);
          return {
            ...comment,
            author: commentAuthor ? {
              id: commentAuthor.id,
              username: commentAuthor.username,
              role: commentAuthor.role,
              avatar: commentAuthor.avatar,
            } : null,
          };
        })
      );

      res.json({
        ...topic,
        author: author ? {
          id: author.id,
          username: author.username,
          role: author.role,
          avatar: author.avatar,
        } : null,
        comments: commentsWithAuthors,
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении темы" });
    }
  });

  // Create a new topic
  app.post("/api/topics", isAuthenticated, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'attachment', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const validatedData = insertTopicSchema.parse(req.body);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Подготовка данных темы
      const topicData = {
        ...validatedData,
        authorId: req.user.id,
        image: undefined as string | undefined,
        attachment: undefined as string | undefined,
        attachmentName: undefined as string | undefined
      };

      // Обработка загруженного изображения
      if (files.image?.[0]) {
        topicData.image = `/uploads/${files.image[0].filename}`;
      }

      // Обработка загруженного файла
      if (files.attachment?.[0]) {
        topicData.attachment = `/uploads/${files.attachment[0].filename}`;
        topicData.attachmentName = files.attachment[0].originalname;
      }

      const newTopic = await storage.createTopic(topicData);

      // Получаем информацию об авторе для ответа
      const author = await storage.getUser(req.user.id);
      const response = {
        ...newTopic,
        author: author ? {
          id: author.id,
          username: author.username,
          role: author.role,
          avatar: author.avatar
        } : null
      };

      res.status(201).json(response);
    } catch (error) {
      // Удаляем загруженные файлы в случае ошибки
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      if (files) {
        Object.values(files).flat().forEach(file => {
          const filePath = path.join(process.cwd(), "uploads", file.filename);
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Ошибка при удалении файла ${filePath}:`, err);
          });
        });
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Ошибка валидации", 
          errors: error.errors 
        });
      }

      console.error("Ошибка при создании темы:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Произошла ошибка при создании темы. Пожалуйста, попробуйте еще раз." 
      });
    }
  });

  // Add a comment to a topic
  app.post("/api/topics/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const topic = await storage.getTopic(topicId);

      if (!topic) {
        return res.status(404).json({ message: "Тема не найдена" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Содержание комментария обязательно" });
      }

      const newComment = await storage.createComment({
        content,
        topicId,
        authorId: req.user.id,
      });

      const author = await storage.getUser(req.user.id);

      res.status(201).json({
        ...newComment,
        author: {
          id: author!.id,
          username: author!.username,
          role: author!.role,
          avatar: author!.avatar,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка при добавлении комментария" });
    }
  });

  // Update user profile
  app.patch("/api/users/profile", isAuthenticated, upload.single("avatar"), async (req, res) => {
    try {
      const { username, bio } = req.body;
      const updates: Record<string, any> = {};

      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
        }
        updates.username = username;
      }

      if (bio) {
        updates.bio = bio;
      }

      // Обработка загруженной аватарки
      if (req.file) {
        // Сохраняем путь к файлу в формате /uploads/filename
        updates.avatar = `/uploads/${req.file.filename}`;
      }

      const updatedUser = await storage.updateUser(req.user.id, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при обновлении профиля" });
    }
  });

  // Get all users (for admin panel)
  app.get("/api/users", isAdminOrModerator, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении пользователей" });
    }
  });

  // Update user role (admin only)
  app.patch("/api/users/:id/role", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: "Недопустимая роль" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);

      if (!updatedUser) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при обновлении роли пользователя" });
    }
  });

  // Добавляем новые маршруты для лайков в существующий файл routes.ts

  // Add like to a topic
  app.post("/api/topics/:id/like", isAuthenticated, async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const topic = await storage.getTopic(topicId);

      if (!topic) {
        return res.status(404).json({ message: "Тема не найдена" });
      }

      const newLike = await storage.createLike({
        userId: req.user.id,
        topicId,
        commentId: undefined,
      });

      res.status(201).json(newLike);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Вы уже поставили лайк этой теме" });
      }
      res.status(500).json({ message: "Ошибка при добавлении лайка" });
    }
  });

  // Remove like from a topic
  app.delete("/api/topics/:id/like", isAuthenticated, async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const topic = await storage.getTopic(topicId);

      if (!topic) {
        return res.status(404).json({ message: "Тема не найдена" });
      }

      await storage.removeLike(req.user.id, topicId);
      res.status(200).json({ message: "Лайк успешно удален" });
    } catch (error) {
      res.status(500).json({ message: "Ошибка при удалении лайка" });
    }
  });

  // Add like to a comment
  app.post("/api/comments/:id/like", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const comments = await storage.getCommentsByTopic(commentId);
      const comment = comments.find(c => c.id === commentId);

      if (!comment) {
        return res.status(404).json({ message: "Комментарий не найден" });
      }

      const newLike = await storage.createLike({
        userId: req.user.id,
        topicId: undefined,
        commentId,
      });

      res.status(201).json(newLike);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Вы уже поставили лайк этому комментарию" });
      }
      res.status(500).json({ message: "Ошибка при добавлении лайка" });
    }
  });

  // Remove like from a comment
  app.delete("/api/comments/:id/like", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const comments = await storage.getCommentsByTopic(commentId);
      const comment = comments.find(c => c.id === commentId);

      if (!comment) {
        return res.status(404).json({ message: "Комментарий не найден" });
      }

      await storage.removeLike(req.user.id, undefined, commentId);
      res.status(200).json({ message: "Лайк успешно удален" });
    } catch (error) {
      res.status(500).json({ message: "Ошибка при удалении лайка" });
    }
  });

  // Get likes for a topic
  app.get("/api/topics/:id/likes", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const likes = await storage.getLikesByTopic(topicId);
      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении лайков" });
    }
  });

  // Get likes for a comment
  app.get("/api/comments/:id/likes", async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const likes = await storage.getLikesByComment(commentId);
      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении лайков" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}