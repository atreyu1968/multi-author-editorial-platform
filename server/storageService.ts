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
    // Bumped to 100 MB so larger ebooks (especially AZW3 / MOBI exports
    // from Calibre) fit. Frontend uploader announces the same cap.
    fileSize: 100 * 1024 * 1024,
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
      "application/vnd.amazon.ebook", // AZW / AZW3
      "application/x-mobipocket-ebook", // MOBI
      // Browsers and curl frequently report niche ebook formats with no
      // registered MIME as `application/octet-stream`. We accept it but
      // still validate by extension below so we don't open the door to
      // arbitrary binaries.
      "application/octet-stream",
    ];
    const allowedExts = [
      ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
      ".pdf", ".epub", ".azw", ".azw3", ".mobi", ".kfx",
    ];
    const ext = (file.originalname.includes(".")
      ? "." + file.originalname.split(".").pop()!.toLowerCase()
      : "");
    const mimeOk = allowedTypes.includes(file.mimetype) || file.mimetype.startsWith("image/");
    const extOk = ext && allowedExts.includes(ext);
    if (mimeOk || extOk) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido (${file.mimetype || "desconocido"} / ${ext || "sin extensión"})`));
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
