import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const PROVIDER = process.env.STORAGE_PROVIDER ?? "local";
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB ?? "50") * 1024 * 1024;

// Octets magiques pour valider un vrai PDF
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

export function validatePdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer.slice(0, 4).equals(PDF_MAGIC);
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export function generateStorageKey(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = uuidv4();
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  return `documents/${year}/${month}/${uuid}${ext}`;
}

// ─── Local Storage ────────────────────────────────────────────────────────────

const LOCAL_PATH = process.env.LOCAL_STORAGE_PATH ?? "./uploads";

async function localUpload(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  const fullPath = path.join(LOCAL_PATH, key);
  const dir = path.dirname(fullPath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(fullPath, buffer);
}

async function localGetSignedUrl(key: string): Promise<string> {
  // En local, on retourne une URL interne via l'API
  return `/api/documents/serve/${encodeURIComponent(key)}`;
}

async function localDelete(key: string): Promise<void> {
  const fullPath = path.join(LOCAL_PATH, key);
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

async function localRead(key: string): Promise<Buffer> {
  const fullPath = path.join(LOCAL_PATH, key);
  return readFile(fullPath);
}

// ─── R2 / S3 Storage ─────────────────────────────────────────────────────────

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

async function r2Upload(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

async function r2GetSignedUrl(key: string): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: 900 }); // 15 minutes
}

async function r2Delete(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  );
}

// ─── Interface publique ───────────────────────────────────────────────────────

export async function uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  if (PROVIDER === "r2") {
    return r2Upload(key, buffer, mimeType);
  }
  return localUpload(key, buffer, mimeType);
}

export async function getDownloadUrl(key: string): Promise<string> {
  if (PROVIDER === "r2") {
    return r2GetSignedUrl(key);
  }
  return localGetSignedUrl(key);
}

export async function deleteFile(key: string): Promise<void> {
  if (PROVIDER === "r2") {
    return r2Delete(key);
  }
  return localDelete(key);
}

export async function readLocalFile(key: string): Promise<Buffer> {
  return localRead(key);
}
