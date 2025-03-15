import multer from "multer";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

export function setupMulter() {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // Генерируем безопасное имя файла
      const fileExt = path.extname(file.originalname);
      const uniqueSuffix = randomBytes(8).toString("hex");
      const safeFilename = path.basename(file.originalname, fileExt)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 40);

      cb(null, `${safeFilename}-${uniqueSuffix}${fileExt}`);
    }
  });

  // File filter для проверки типов файлов
  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedImageTypes = /\.(jpg|jpeg|png|gif)$/i;
    const allowedFileTypes = /\.(pdf|doc|docx|txt|zip|rar)$/i;

    if (file.fieldname === 'image' && !file.originalname.match(allowedImageTypes)) {
      return cb(new Error("Допускаются только изображения (jpg, jpeg, png, gif)"));
    }

    if (file.fieldname === 'attachment' && !file.originalname.match(allowedFileTypes)) {
      return cb(new Error("Недопустимый тип файла. Разрешены: pdf, doc, docx, txt, zip, rar"));
    }

    cb(null, true);
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 2 // Allow up to 2 files (1 image + 1 attachment)
    }
  });
}