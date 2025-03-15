import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

// Для развертывания на другом сервере используйте переменные окружения
// DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE или настройте эти значения
export const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || '149.202.88.119',
  user: process.env.DB_USER || 'gs267494',
  password: process.env.DB_PASSWORD || 'gGwLbS1XSOp3',
  database: process.env.DB_DATABASE || 'gs267494',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database and create tables if they don't exist
export async function initDatabase() {
  try {
    const connection = await poolConnection.getConnection();
    console.log('Successfully connected to MySQL database');

    try {
      const db = drizzle(connection, { mode: 'default', schema });

      // В версии для деплоя мы не будем удалять существующие таблицы
      // (раскомментируйте следующие строки, только если нужно пересоздать базу)
      /*
      await db.execute(sql`DROP TABLE IF EXISTS likes`);
      await db.execute(sql`DROP TABLE IF EXISTS comments`);
      await db.execute(sql`DROP TABLE IF EXISTS topics`);
      */

      // Create users table if not exists
      await db.execute(sql`
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

      // Create topics table with attachment fields
      await db.execute(sql`
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

      // Create comments table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          content TEXT NOT NULL,
          author_id INT NOT NULL,
          topic_id INT NOT NULL,
          likes_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users(id),
          FOREIGN KEY (topic_id) REFERENCES topics(id)
        )
      `);

      // Create likes table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          topic_id INT,
          comment_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (topic_id) REFERENCES topics(id),
          FOREIGN KEY (comment_id) REFERENCES comments(id),
          CONSTRAINT unique_topic_like UNIQUE (user_id, topic_id),
          CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id),
          CHECK ((topic_id IS NOT NULL AND comment_id IS NULL) OR (topic_id IS NULL AND comment_id IS NOT NULL))
        )
      `);

    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

export const db = drizzle(poolConnection, { mode: 'default' });

// Make the pool connection available for raw queries
(db as any).connection = poolConnection;

// Export tables for convenience
export const dbSchema = {
  users: schema.users,
  topics: schema.topics,
  comments: schema.comments
};