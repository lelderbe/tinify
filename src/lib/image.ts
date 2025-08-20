export type SupportedMime = "image/jpeg" | "image/png";

export interface SourceImage {
    id: string;
    file: File;
    objectUrl: string;
    width: number;
    height: number;
    type: SupportedMime;
    originalBytes: number;
}

export interface ProcessedImage extends SourceImage {
    blob: Blob;
    compressedBytes: number;
}

export function isSupportedFile(file: File): file is File & { type: SupportedMime } {
    return file.type === "image/jpeg" || file.type === "image/png";
}

export async function readImageFile(file: File): Promise<SourceImage> {
    if (!isSupportedFile(file)) {
        throw new Error("Unsupported file type");
    }
    const objectUrl = URL.createObjectURL(file);
    try {
        const img = await loadHtmlImage(objectUrl);
        return {
            id: crypto.randomUUID(),
            file,
            objectUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            type: file.type,
            originalBytes: file.size,
        };
    } catch (err) {
        URL.revokeObjectURL(objectUrl);
        throw err;
    }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = src;
    });
}

export async function recompressImageLossless(image: SourceImage): Promise<ProcessedImage> {
    // Strictly use backend. If it fails, propagate error.
    const blob = await compressOnServer(image.file);
    return { ...image, blob, compressedBytes: blob.size };
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
}

async function compressOnServer(file: File): Promise<Blob> {
    const form = new FormData();
    form.set("file", file, file.name);
    const res = await fetch("/api/compress", {
        method: "POST",
        body: form,
    });
    if (!res.ok) {
        throw new Error("server_compress_failed");
    }
    return await res.blob();
}
