import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import {
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
  type ObjectAclPolicy,
  ObjectPermission,
} from "./objectAcl";

const DEFAULT_LOCAL_OBJECT_ROOT = "/app/uploads";
const LOCAL_UPLOAD_ROUTE_PREFIX = "/api/storage/local-upload/";
const LOCAL_UPLOAD_ENTITY_PREFIX = "uploads";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class InvalidObjectPathError extends Error {
  constructor(message = "Invalid object path") {
    super(message);
    this.name = "InvalidObjectPathError";
    Object.setPrototypeOf(this, InvalidObjectPathError.prototype);
  }
}

export interface LocalObjectMetadata {
  contentType: string;
  originalName: string;
  size?: number;
  uploadedAt?: string;
  aclPolicy?: ObjectAclPolicy;
}

export interface LocalObjectFile {
  name: string;
  entityPath: string;
  filePath: string;
  metaPath: string;
  getAclPolicy: () => Promise<ObjectAclPolicy | null>;
  setAclPolicy: (aclPolicy: ObjectAclPolicy) => Promise<void>;
}

interface UploadMetadataInput {
  originalName?: string;
  contentType?: string;
  size?: number;
}

export class ObjectStorageService {
  getLocalObjectRoot(): string {
    return path.resolve(process.env["LOCAL_OBJECT_ROOT"] || DEFAULT_LOCAL_OBJECT_ROOT);
  }

  getPublicObjectSearchPaths(): Array<string> {
    return [this.getLocalObjectRoot()];
  }

  getPrivateObjectDir(): string {
    return this.getLocalObjectRoot();
  }

  async searchPublicObject(filePath: string): Promise<LocalObjectFile | null> {
    try {
      const entityPath = sanitizeRelativeObjectPath(filePath);
      const objectFile = this.getLocalObjectFile(entityPath);
      await assertLocalFileExists(objectFile);
      return objectFile;
    } catch (err) {
      if (err instanceof ObjectNotFoundError || err instanceof InvalidObjectPathError) {
        return null;
      }
      throw err;
    }
  }

  async downloadObject(
    objectFile: LocalObjectFile,
    cacheTtlSec: number = 3600,
  ): Promise<Response> {
    await assertLocalFileExists(objectFile);
    const fileStat = await stat(objectFile.filePath);
    const metadata = await this.readMetadata(objectFile);
    const aclPolicy = await getObjectAclPolicy(objectFile);
    const isPublic = !aclPolicy || aclPolicy.visibility === "public";

    const nodeStream = createReadStream(objectFile.filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": metadata?.contentType || "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      },
    });
  }

  async getObjectEntityUploadURL(
    metadata: UploadMetadataInput = {},
  ): Promise<string> {
    const objectId = randomUUID();
    const entityPath = `${LOCAL_UPLOAD_ENTITY_PREFIX}/${objectId}`;
    const objectFile = this.getLocalObjectFile(entityPath);
    await mkdir(path.dirname(objectFile.filePath), { recursive: true });
    await this.writeMetadata(objectFile, {
      contentType: metadata.contentType || "application/octet-stream",
      originalName: metadata.originalName || objectId,
      size: metadata.size,
    });
    return `${LOCAL_UPLOAD_ROUTE_PREFIX}${entityPath}`;
  }

  async saveLocalUpload(
    entityPath: string,
    body: Buffer,
    metadata: UploadMetadataInput = {},
  ): Promise<{ objectPath: string; objectFile: LocalObjectFile }> {
    const normalizedEntityPath = sanitizeUploadEntityPath(entityPath);
    const objectFile = this.getLocalObjectFile(normalizedEntityPath);
    const existingMetadata = await this.readMetadata(objectFile);

    await mkdir(path.dirname(objectFile.filePath), { recursive: true });
    await writeFile(objectFile.filePath, body);
    await this.writeMetadata(objectFile, {
      contentType:
        metadata.contentType ||
        existingMetadata?.contentType ||
        "application/octet-stream",
      originalName:
        metadata.originalName ||
        existingMetadata?.originalName ||
        path.posix.basename(normalizedEntityPath),
      size: body.length,
      uploadedAt: new Date().toISOString(),
      aclPolicy: existingMetadata?.aclPolicy,
    });

    return {
      objectPath: `/objects/${normalizedEntityPath}`,
      objectFile,
    };
  }

  async getObjectEntityFile(objectPath: string): Promise<LocalObjectFile> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const entityPath = sanitizeRelativeObjectPath(objectPath.slice("/objects/".length));
    const objectFile = this.getLocalObjectFile(entityPath);
    await assertLocalFileExists(objectFile);
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    let pathname = rawPath;
    if (/^https?:\/\//i.test(rawPath)) {
      pathname = new URL(rawPath).pathname;
    }

    const localPrefixes = [
      LOCAL_UPLOAD_ROUTE_PREFIX,
      LOCAL_UPLOAD_ROUTE_PREFIX.replace(/^\/api/, ""),
    ];

    for (const prefix of localPrefixes) {
      if (pathname.startsWith(prefix)) {
        const entityPath = sanitizeRelativeObjectPath(pathname.slice(prefix.length));
        return `/objects/${entityPath}`;
      }
    }

    return rawPath;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/objects/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: LocalObjectFile;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  private getLocalObjectFile(entityPath: string): LocalObjectFile {
    const normalizedEntityPath = sanitizeRelativeObjectPath(entityPath);
    const root = this.getLocalObjectRoot();
    const filePath = resolveInsideRoot(root, normalizedEntityPath);
    const metaPath = `${filePath}.meta.json`;

    return {
      name: normalizedEntityPath,
      entityPath: normalizedEntityPath,
      filePath,
      metaPath,
      getAclPolicy: async () => (await this.readMetadataFile(metaPath))?.aclPolicy ?? null,
      setAclPolicy: async (aclPolicy) => {
        const metadata = await this.readMetadataFile(metaPath);
        await this.writeMetadataFile(metaPath, {
          contentType: metadata?.contentType || "application/octet-stream",
          originalName: metadata?.originalName || path.posix.basename(normalizedEntityPath),
          size: metadata?.size,
          uploadedAt: metadata?.uploadedAt,
          aclPolicy,
        });
      },
    };
  }

  private async readMetadata(objectFile: LocalObjectFile): Promise<LocalObjectMetadata | null> {
    return this.readMetadataFile(objectFile.metaPath);
  }

  private async writeMetadata(
    objectFile: LocalObjectFile,
    metadata: LocalObjectMetadata,
  ): Promise<void> {
    await this.writeMetadataFile(objectFile.metaPath, metadata);
  }

  private async readMetadataFile(metaPath: string): Promise<LocalObjectMetadata | null> {
    try {
      const raw = await readFile(metaPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<LocalObjectMetadata>;
      return {
        contentType: parsed.contentType || "application/octet-stream",
        originalName: parsed.originalName || path.basename(metaPath, ".meta.json"),
        size: parsed.size,
        uploadedAt: parsed.uploadedAt,
        aclPolicy: parsed.aclPolicy,
      };
    } catch (err) {
      if (isNodeError(err) && err.code === "ENOENT") return null;
      throw err;
    }
  }

  private async writeMetadataFile(
    metaPath: string,
    metadata: LocalObjectMetadata,
  ): Promise<void> {
    await mkdir(path.dirname(metaPath), { recursive: true });
    await writeFile(metaPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  }
}

async function assertLocalFileExists(objectFile: LocalObjectFile): Promise<void> {
  try {
    const fileStat = await stat(objectFile.filePath);
    if (!fileStat.isFile()) throw new ObjectNotFoundError();
  } catch (err) {
    if (isNodeError(err) && err.code === "ENOENT") {
      throw new ObjectNotFoundError();
    }
    throw err;
  }
}

function sanitizeUploadEntityPath(entityPath: string): string {
  const normalized = sanitizeRelativeObjectPath(entityPath);
  const parts = normalized.split("/");
  if (
    parts.length !== 2 ||
    parts[0] !== LOCAL_UPLOAD_ENTITY_PREFIX ||
    !UUID_RE.test(parts[1]!)
  ) {
    throw new InvalidObjectPathError("Invalid local upload path");
  }
  return normalized;
}

function sanitizeRelativeObjectPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed.includes("\0") || trimmed.includes("\\")) {
    throw new InvalidObjectPathError();
  }
  if (path.posix.isAbsolute(trimmed)) {
    throw new InvalidObjectPathError();
  }

  const normalized = path.posix.normalize(trimmed);
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.split("/").some((part) => part === "..")
  ) {
    throw new InvalidObjectPathError();
  }

  return normalized;
}

function resolveInsideRoot(root: string, relativePath: string): string {
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new InvalidObjectPathError();
  }
  return resolved;
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}
