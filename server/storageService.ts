import { Response, Request, NextFunction } from "express";
import { localStorageService } from "./localStorage";
import multer, { FileFilterCallback, StorageEngine } from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";

const isReplitEnvironment = (): boolean => {
  return !!(
    process.env.REPL_ID &&
    process.env.REPLIT_SIDECAR_URL
  );
};

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";

const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const publicDir = path.join(UPLOADS_DIR, "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    cb(null, publicDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "application/epub+zip",
      "application/x-mobipocket-ebook",
    ];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"));
    }
  },
});

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export async function handleFileUpload(
  req: Request,
  file: Express.Multer.File
): Promise<UploadResult> {
  const relativePath = `/uploads/public/${file.filename}`;
  
  return {
    url: relativePath,
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  };
}

export async function deleteUploadedFile(filePath: string): Promise<boolean> {
  if (isReplitEnvironment()) {
    return false;
  }
  return localStorageService.deleteFile(filePath);
}

export function getStorageType(): "replit" | "local" {
  return isReplitEnvironment() ? "replit" : "local";
}

export function serveUploadsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith("/uploads/")) {
      return next();
    }
    
    localStorageService.downloadFile(req.path, res);
  };
}
