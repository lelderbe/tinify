import express from "express";
import multer from "multer";
import sharp from "sharp";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Настройка CORS
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

// Настройка multer для загрузки файлов в память
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB максимум
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
            cb(null, true);
        } else {
            cb(new Error("Поддерживаются только JPG и PNG форматы"));
        }
    },
});

// Интерфейс для результата сжатия
interface CompressionResult {
    originalName: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    compressedBuffer: Buffer;
    mimeType: string;
}

// Функция сжатия изображения
async function compressImage(buffer: Buffer, mimeType: string, originalName: string): Promise<CompressionResult> {
    let sharpInstance = sharp(buffer);

    // Получаем метаданные изображения
    const metadata = await sharpInstance.metadata();

    let compressedBuffer: Buffer;

    if (mimeType === "image/jpeg") {
        // Для JPEG используем более агрессивное сжатие
        compressedBuffer = await sharpInstance
            .jpeg({
                quality: 75, // Снижаем качество для лучшего сжатия
                progressive: true, // Прогрессивная загрузка
                mozjpeg: true, // Используем mozjpeg для лучшего сжатия
            })
            .toBuffer();
    } else if (mimeType === "image/png") {
        // Для PNG используем оптимизацию палитры и сжатие
        compressedBuffer = await sharpInstance
            .png({
                quality: 80, // Качество для PNG
                compressionLevel: 9, // Максимальное сжатие
                progressive: true,
                palette: true, // Оптимизация палитры для меньшего размера
            })
            .toBuffer();
    } else {
        throw new Error("Неподдерживаемый формат изображения");
    }

    const originalSize = buffer.length;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
        originalName,
        originalSize,
        compressedSize,
        compressionRatio,
        compressedBuffer,
        mimeType,
    };
}

// API endpoint для сжатия изображений
app.post("/api/compress", upload.array("images"), async (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: "Файлы не найдены" });
        }

        const results: CompressionResult[] = [];

        for (const file of files) {
            try {
                const result = await compressImage(file.buffer, file.mimetype, file.originalname);
                results.push(result);
            } catch (error) {
                console.error(`Ошибка при обработке файла ${file.originalname}:`, error);
                // Продолжаем обработку других файлов
            }
        }

        // Возвращаем результаты как JSON с base64 данными
        const response = results.map((result) => ({
            originalName: result.originalName,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            compressionRatio: Number(result.compressionRatio.toFixed(1)),
            compressedData: result.compressedBuffer.toString("base64"),
            mimeType: result.mimeType,
        }));

        res.json({ results: response });
    } catch (error) {
        console.error("Ошибка при сжатии изображений:", error);
        res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
});

// Проверка здоровья сервера
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Сервер сжатия изображений работает" });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📷 API для сжатия изображений: http://localhost:${PORT}/api/compress`);
});

export default app;
