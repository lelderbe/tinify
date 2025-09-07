import React from 'react';
import { formatBytes } from './lib/image';
import { useImages } from './hooks/useImages';
import { useDrop } from './hooks/useDrop';
import { getStoredJpgQuality, setStoredJpgQuality } from './lib/jpgQuality';
import { JPG_QUALITY_STEP, MAX_FILE_SIZE, MAX_JPG_QUALITY, MIN_JPG_QUALITY } from '../shared/constants';

export default function App() {
    const [jpgQuality, setJpgQuality] = React.useState(getStoredJpgQuality);
    const {
        items,
        addFiles,
        clearAll,
        downloadAll,
        errorsById,
        clearError,
        processingIds,
        recompressJpgFiles,
        handleDownload,
    } = useImages(jpgQuality);
    const { isOver, onDrop, onDragOver, onDragEnter, onDragLeave } = useDrop(addFiles);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const qualityTimeoutRef = React.useRef<NodeJS.Timeout>();

    // Обработчик изменения качества JPG с debounce
    const handleJpgQualityChange = React.useCallback(
        (newQuality: number) => {
            setJpgQuality(newQuality);

            // Очищаем предыдущий таймаут
            clearTimeout(qualityTimeoutRef.current);

            // Устанавливаем новый таймаут для пересжатия
            qualityTimeoutRef.current = setTimeout(() => recompressJpgFiles(newQuality), 500); // 500ms задержка
        },
        [recompressJpgFiles]
    );

    // Сохраняем jpgQuality в localStorage при изменении
    React.useEffect(() => {
        setStoredJpgQuality(jpgQuality);
    }, [jpgQuality]);

    // Очищаем таймаут при размонтировании
    React.useEffect(() => {
        return () => {
            clearTimeout(qualityTimeoutRef.current);
        };
    }, []);

    const handleSelectClick = React.useCallback((e: React.SyntheticEvent) => {
        e.stopPropagation();
        inputRef.current?.click();
    }, []);

    const handleInputChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files);
                e.target.value = '';
            }
        },
        [addFiles]
    );

    // Вычисляем количество готовых файлов
    const compressedItemsCount = React.useMemo(() => {
        return items.filter((item) => 'blob' in item).length;
    }, [items]);

    return (
        <div
            className="app"
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Полноэкранный оверлей для drag and drop */}
            {isOver && (
                <div className="drag-overlay">
                    <div className="drag-overlay-content">
                        <div className="drag-icon">📷</div>
                        <h2>Отпустите файлы для загрузки</h2>
                        <p>Поддерживаются JPG и PNG файлы</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <div className="logo">
                    <div className="logo-icon">📷</div>
                    <span className="logo-text">Tinify</span>
                </div>
                <div className="settings">
                    <div className="setting-item quality-setting">
                        <label htmlFor="jpg-quality" className="quality-label">
                            Качество JPG: {jpgQuality}%
                        </label>
                        <input
                            id="jpg-quality"
                            type="range"
                            min={MIN_JPG_QUALITY}
                            max={MAX_JPG_QUALITY}
                            step={JPG_QUALITY_STEP}
                            value={jpgQuality}
                            onChange={(e) => handleJpgQualityChange(Number(e.target.value))}
                            className="quality-slider"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="hero">
                    <h1 className="hero-title">Оптимизация изображений</h1>
                </div>

                <div className="upload-section">
                    <div className={`upload-area ${isOver ? 'dragover' : ''}`} onClick={handleSelectClick}>
                        <div className="upload-icon">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7,10 12,15 17,10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <div className="upload-text">
                            <h4>Перетащите изображения или нажмите для загрузки</h4>
                            <p>Поддерживаются JPG и PNG файлы до {MAX_FILE_SIZE}MB каждый</p>
                        </div>
                        <button className="choose-files-btn" onClick={handleSelectClick}>
                            Выбрать изображения
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            multiple
                            onChange={handleInputChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {items.length > 0 && (
                    <div className="images-section">
                        <div className="images-header">
                            <h3>Загруженные изображения ({items.length})</h3>
                            <div className="images-actions">
                                {compressedItemsCount > 0 && (
                                    <button className="btn-primary" onClick={downloadAll}>
                                        Скачать все ({compressedItemsCount})
                                    </button>
                                )}
                                <button className="btn-secondary" onClick={clearAll}>
                                    Очистить
                                </button>
                            </div>
                        </div>

                        <div className="uploaded-files">
                            {items.map((item) => {
                                const isCompressed = 'blob' in item;
                                const isProcessing = processingIds.has(item.id);
                                const hasError = errorsById[item.id];
                                const compressionPercent = isCompressed
                                    ? Math.round((item.compressedBytes / item.originalBytes - 1) * 100)
                                    : 0;

                                return (
                                    <div className="file-card" key={item.id} onClick={() => handleDownload(item)}>
                                        <div className="file-thumbnail">
                                            <img src={item.objectUrl} alt={item.file.name} />
                                        </div>

                                        <div className="file-info">
                                            <div className="file-name" title={item.file.name}>
                                                {item.file.name}
                                            </div>
                                            {isProcessing && (
                                                <div className="file-status processing">
                                                    <span className="status-icon loading">⟳</span>
                                                    <span>Сжимается...</span>
                                                </div>
                                            )}
                                            {isCompressed && !isProcessing && (
                                                <div className="file-status">
                                                    <span className="status-icon">✓</span>
                                                    <span>Сжато успешно</span>
                                                </div>
                                            )}
                                            {hasError && !isProcessing && (
                                                <div className="file-status error-status">
                                                    <span className="status-icon">✕</span>
                                                    <span>Сжатие не удалось</span>
                                                </div>
                                            )}
                                            <div className="file-size">
                                                {formatBytes(item.originalBytes)} →{' '}
                                                {isCompressed ? formatBytes(item.compressedBytes) : '—'}
                                            </div>
                                        </div>

                                        <div className="file-actions">
                                            <div className="file-type-badge">
                                                {item.type === 'image/png' ? 'PNG' : 'JPG'}
                                            </div>
                                            {isCompressed && !isProcessing && (
                                                <div
                                                    className={`compression-percent ${
                                                        compressionPercent > 0 ? 'bad' : ''
                                                    }`}
                                                >
                                                    {compressionPercent}%
                                                </div>
                                            )}
                                            <div className="action-buttons">
                                                {isCompressed && !isProcessing ? (
                                                    <button className="download-btn">Скачать</button>
                                                ) : (
                                                    <button className="download-btn" disabled>
                                                        {isProcessing ? 'Сжимается...' : 'Не сжато'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {hasError && (
                                            <div className="error" onClick={() => clearError(item.id)}>
                                                {hasError}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <p>© 2025 Tinify</p>
            </footer>
        </div>
    );
}
