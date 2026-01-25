import fs from "fs";
import path from "path";
import { Response } from "express";
import { randomUUID } from "crypto";
import mime from "mime-types";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";
const PUBLIC_DIR = path.join(UPLOADS_DIR, "public");
const PRIVATE_DIR = path.join(UPLOADS_DIR, "private");

function ensureDirectories() {
  [UPLOADS_DIR, PUBLIC_DIR, PRIVATE_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

ensureDirectories();

export class LocalStorageService {
  constructor() {
    ensureDirectories();
  }

  getPublicDir(): string {
    return PUBLIC_DIR;
  }

  getPrivateDir(): string {
    return PRIVATE_DIR;
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    isPublic: boolean = true
  ): Promise<string> {
    const ext = path.extname(originalName) || ".bin";
    const filename = `${randomUUID()}${ext}`;
    const targetDir = isPublic ? PUBLIC_DIR : PRIVATE_DIR;
    const filePath = path.join(targetDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);

    const relativePath = isPublic
      ? `/uploads/public/${filename}`
      : `/uploads/private/${filename}`;
    return relativePath;
  }

  async uploadFileFromPath(
    sourcePath: string,
    originalName: string,
    isPublic: boolean = true
  ): Promise<string> {
    const fileBuffer = await fs.promises.readFile(sourcePath);
    return this.uploadFile(fileBuffer, originalName, isPublic);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = this.normalizeFilePath(filePath);
      if (normalizedPath && fs.existsSync(normalizedPath)) {
        await fs.promises.unlink(normalizedPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    const normalizedPath = this.normalizeFilePath(filePath);
    if (!normalizedPath) return false;
    return fs.existsSync(normalizedPath);
  }

  normalizeFilePath(urlPath: string): string | null {
    if (!urlPath) return null;

    if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
      return null;
    }

    if (urlPath.startsWith("/uploads/public/")) {
      const filename = urlPath.replace("/uploads/public/", "");
      return path.join(PUBLIC_DIR, filename);
    }

    if (urlPath.startsWith("/uploads/private/")) {
      const filename = urlPath.replace("/uploads/private/", "");
      return path.join(PRIVATE_DIR, filename);
    }

    return null;
  }

  async downloadFile(filePath: string, res: Response): Promise<void> {
    const normalizedPath = this.normalizeFilePath(filePath);
    if (!normalizedPath || !fs.existsSync(normalizedPath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const stat = await fs.promises.stat(normalizedPath);
    const contentType = mime.lookup(normalizedPath) || "application/octet-stream";

    res.set({
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Cache-Control": "public, max-age=3600",
    });

    const stream = fs.createReadStream(normalizedPath);
    stream.pipe(res);
  }

  getUploadUrl(): string {
    return "/api/upload";
  }
}

export const localStorageService = new LocalStorageService();
