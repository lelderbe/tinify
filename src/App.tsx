import React, { useState, useCallback } from "react";
import "./App.css";

interface ProcessedImage {
    id: string;
    originalName: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    originalUrl: string;
    compressedUrl: string;
    compressedData: string; // base64 данные
    mimeType: string;
}

function App() {
    const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const compressImages = useCallback(async (files: File[]): Promise<ProcessedImage[]> => {
        const formData = new FormData();

        files.forEach((file) => {
            formData.append("images", file);
        });

        try {
            const response = await fetch("/api/compress", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.results || !Array.isArray(data.results)) {
                throw new Error("Неверный формат ответа от сервера");
            }

            return data.results.map((result: any, index: number) => {
                const originalFile = files.find((f) => f.name === result.originalName);
                const originalUrl = originalFile ? URL.createObjectURL(originalFile) : "";

                // Создаем blob из base64 данных
                const byteCharacters = atob(result.compressedData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const compressedBlob = new Blob([byteArray], { type: result.mimeType });
                const compressedUrl = URL.createObjectURL(compressedBlob);

                return {
                    id: Date.now() + Math.random().toString() + index,
                    originalName: result.originalName,
                    originalSize: result.originalSize,
                    compressedSize: result.compressedSize,
                    compressionRatio: result.compressionRatio,
                    originalUrl,
                    compressedUrl,
                    compressedData: result.compressedData,
                    mimeType: result.mimeType,
                };
            });
        } catch (error) {
            console.error("Ошибка при сжатии изображений:", error);
            throw error;
        }
    }, []);

    const processFiles = useCallback(
        async (files: FileList) => {
            setIsProcessing(true);

            const validFiles = Array.from(files).filter(
                (file) => file.type === "image/jpeg" || file.type === "image/png"
            );

            if (validFiles.length === 0) {
                alert("Пожалуйста, выберите файлы в формате JPG или PNG");
                setIsProcessing(false);
                return;
            }

            try {
                // Отправляем все файлы на сервер одновременно
                const newProcessedImages = await compressImages(validFiles);
                setProcessedImages((prev) => [...prev, ...newProcessedImages]);
            } catch (error) {
                console.error("Ошибка при обработке файлов:", error);
                alert("Ошибка при обработке файлов. Проверьте подключение к серверу.");
            } finally {
                setIsProcessing(false);
            }
        },
        [compressImages]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFiles(files);
            }
        },
        [processFiles]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                processFiles(files);
            }
        },
        [processFiles]
    );

    const handleDownload = useCallback((image: ProcessedImage) => {
        const link = document.createElement("a");
        link.href = image.compressedUrl;

        // Сохраняем оригинальное расширение файла
        const originalName = image.originalName;
        const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf("."));
        const extension = originalName.substring(originalName.lastIndexOf("."));
        link.download = `${nameWithoutExtension}_compressed${extension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const formatFileSize = useCallback((bytes: number) => {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }, []);

    const clearAll = useCallback(() => {
        // Освобождаем URLs чтобы избежать утечек памяти
        processedImages.forEach((image) => {
            URL.revokeObjectURL(image.originalUrl);
            URL.revokeObjectURL(image.compressedUrl);
        });
        setProcessedImages([]);
    }, [processedImages]);

    return (
        <div className="app">
            <header className="app-header">
                <h1>Сжатие изображений</h1>
                <p>Загрузите JPG или PNG изображения для сжатия без потери качества</p>
            </header>

            <main className="main-content">
                <div
                    className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="drop-zone-content">
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17,8 12,3 7,8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <h3>Перетащите изображения сюда</h3>
                        <p>или</p>
                        <label className="file-input-label">
                            <input
                                type="file"
                                accept="image/jpeg,image/png"
                                multiple
                                onChange={handleFileInput}
                                className="file-input"
                            />
                            Выберите файлы
                        </label>
                    </div>
                </div>

                {isProcessing && (
                    <div className="processing-indicator">
                        <div className="loader"></div>
                        <p>Сжатие изображений на сервере...</p>
                        <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Пожалуйста, подождите</p>
                    </div>
                )}

                {processedImages.length > 0 && (
                    <div className="results-section">
                        <div className="results-header">
                            <h2>Результаты ({processedImages.length})</h2>
                            <button onClick={clearAll} className="clear-btn">
                                Очистить все
                            </button>
                        </div>

                        <div className="images-grid">
                            {processedImages.map((image) => (
                                <div key={image.id} className="image-card">
                                    <div className="image-comparison">
                                        <div className="image-item">
                                            <h4>Оригинал</h4>
                                            <img src={image.originalUrl} alt="Оригинал" />
                                            <p className="size-info">{formatFileSize(image.originalSize)}</p>
                                        </div>

                                        <div className="arrow">→</div>

                                        <div className="image-item">
                                            <h4>Сжатое</h4>
                                            <img src={image.compressedUrl} alt="Сжатое" />
                                            <p className="size-info">{formatFileSize(image.compressedSize)}</p>
                                        </div>
                                    </div>

                                    <div className="compression-stats">
                                        <p className="compression-ratio">Сжатие: {image.compressionRatio}%</p>
                                        <p className="original-name">{image.originalName}</p>
                                    </div>

                                    <button onClick={() => handleDownload(image)} className="download-btn">
                                        Скачать сжатое изображение
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
