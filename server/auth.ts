import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "forum-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? 'strict' : 'lax'
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Неверный email или пароль" });
          }
          
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Неверный email или пароль" });
          }
          
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // В production версии создайте начального администратора через специальный скрипт или API
  /* 
  // Разкомментируйте и настройте для создания администратора при первом запуске
  (async () => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    
    if (!adminPassword) {
      console.log('Для создания администратора укажите переменные окружения ADMIN_EMAIL, ADMIN_PASSWORD и ADMIN_USERNAME');
      return;
    }
    
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      await storage.createUser({
        username: adminUsername,
        email: adminEmail,
        password: await hashPassword(adminPassword),
        role: UserRole.ADMIN,
      });
      console.log(`Администратор создан: ${adminUsername} (${adminEmail})`);
    }
  })();
  */

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
      }

      // Create the user
      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
        role: UserRole.USER,
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Неверный email или пароль" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
