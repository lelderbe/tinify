import express from "express";
import cors from "cors";
import multer from "multer";
import sharp from "sharp";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

app.use(cors());

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

app.post("/api/compress", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "file is required" });
        }
        const { buffer, originalname } = req.file;

        const img = sharp(buffer);
        const meta = await img.metadata();

        if (meta.format === "png") {
            const out = await sharp(buffer)
                .rotate()
                .png({ compressionLevel: 9, effort: 10, progressive: false, adaptiveFiltering: true })
                .toBuffer();
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Content-Disposition", `inline; filename="${safeName(originalname)}"`);
            return res.send(out);
        }

        if (meta.format === "jpeg" || meta.format === "jpg" || meta.format === "pjpeg") {
            const out = await sharp(buffer)
                .rotate()
                .jpeg({ quality: 85, mozjpeg: true, progressive: true, chromaSubsampling: "4:2:0" })
                .toBuffer();
            res.setHeader("Content-Type", "image/jpeg");
            res.setHeader("Content-Disposition", `inline; filename="${safeName(originalname)}"`);
            return res.send(out);
        }

        // Unknown formats: pass through unchanged
        res.setHeader("Content-Type", req.file.mimetype || "application/octet-stream");
        res.setHeader("Content-Disposition", `inline; filename="${safeName(originalname)}"`);
        return res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "compression_failed" });
    }
});

function safeName(name: string): string {
    return name.replace(/[\r\n"\\<>]/g, "_");
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
