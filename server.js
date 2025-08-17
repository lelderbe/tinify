const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const sharp = require('sharp');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/compressed', express.static('compressed'));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Генерируем уникальное имя файла с временной меткой
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Проверяем, что файл является JPG или PNG изображением
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Поддерживаются только JPG и PNG файлы!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // Максимальный размер файла 10MB
    }
});

// Функция для сжатия изображений без потери качества
async function compressImage(inputPath, outputPath, originalname) {
    try {
        const ext = path.extname(originalname).toLowerCase();
        
        if (ext === '.jpg' || ext === '.jpeg') {
            // Сжатие JPG с помощью mozjpeg
            await imagemin([inputPath], {
                destination: path.dirname(outputPath),
                plugins: [
                    imageminMozjpeg({
                        quality: 85, // Высокое качество
                        progressive: true
                    })
                ]
            });
            
            // Переименовываем файл в нужное имя
            const compressedFiles = await fs.readdir(path.dirname(outputPath));
            const compressedFile = compressedFiles.find(file => file.includes(path.basename(inputPath, path.extname(inputPath))));
            if (compressedFile) {
                await fs.move(path.join(path.dirname(outputPath), compressedFile), outputPath);
            }
        } else if (ext === '.png') {
            // Сжатие PNG с помощью pngquant
            await imagemin([inputPath], {
                destination: path.dirname(outputPath),
                plugins: [
                    imageminPngquant({
                        quality: [0.8, 1.0] // Высокое качество для PNG
                    })
                ]
            });
            
            // Переименовываем файл в нужное имя  
            const compressedFiles = await fs.readdir(path.dirname(outputPath));
            const compressedFile = compressedFiles.find(file => file.includes(path.basename(inputPath, path.extname(inputPath))));
            if (compressedFile) {
                await fs.move(path.join(path.dirname(outputPath), compressedFile), outputPath);
            }
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка при сжатии изображения:', error);
        // Если сжатие не удалось, просто копируем оригинальный файл
        await fs.copy(inputPath, outputPath);
        return false;
    }
}

// API endpoint для загрузки и сжатия изображений
app.post('/api/compress', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Не выбраны файлы для загрузки' });
        }

        const results = [];

        for (const file of req.files) {
            const originalSize = file.size;
            const compressedFilename = `compressed-${file.filename}`;
            const compressedPath = path.join('compressed', compressedFilename);

            // Сжимаем изображение
            const compressionSuccess = await compressImage(file.path, compressedPath, file.originalname);
            
            // Получаем размер сжатого файла
            const compressedStats = await fs.stat(compressedPath);
            const compressedSize = compressedStats.size;
            
            // Вычисляем процент сжатия
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

            results.push({
                id: path.parse(file.filename).name,
                originalName: file.originalname,
                originalSize: originalSize,
                compressedSize: compressedSize,
                compressionRatio: compressionRatio,
                downloadUrl: `/compressed/${compressedFilename}`,
                success: compressionSuccess
            });

            // Удаляем оригинальный загруженный файл
            await fs.remove(file.path);
        }

        res.json({
            success: true,
            message: `Обработано ${results.length} изображений`,
            results: results
        });

    } catch (error) {
        console.error('Ошибка при обработке файлов:', error);
        res.status(500).json({
            error: 'Ошибка при обработке файлов',
            details: error.message
        });
    }
});

// API endpoint для скачивания сжатого файла
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'compressed', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Ошибка при скачивании файла:', err);
                res.status(404).json({ error: 'Файл не найден' });
            }
        });
    } else {
        res.status(404).json({ error: 'Файл не найден' });
    }
});

// API endpoint для получения информации о файле
app.get('/api/info/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'compressed', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        const stats = await fs.stat(filePath);
        res.json({
            filename: filename,
            size: stats.size,
            created: stats.birthtime
        });

    } catch (error) {
        console.error('Ошибка при получении информации о файле:', error);
        res.status(500).json({ error: 'Ошибка при получении информации о файле' });
    }
});

// Обслуживание главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log('📁 Папки для файлов созданы:');
    console.log('   - uploads/ - временные загруженные файлы');
    console.log('   - compressed/ - сжатые изображения');
    console.log('   - public/ - статичные файлы фронтенда');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Получен сигнал SIGTERM, завершаю работу сервера...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nПолучен сигнал SIGINT (Ctrl+C), завершаю работу сервера...');
    process.exit(0);
});