import React from "react";
import { formatBytes, type ProcessedImage, type SourceImage } from "./lib/image";
import { useImages } from "./hooks/useImages";
import { useDrop } from "./hooks/useDrop";

export default function App() {
    const { items, addFiles, clearAll, downloadAll, setItems, errorsById, clearError, setErrorsById, processingIds } =
        useImages();
    const { isOver, onDrop, onDragOver, onDragEnter, onDragLeave } = useDrop(addFiles);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const onSelectClick = React.useCallback((e: React.SyntheticEvent) => {
        e.stopPropagation();
        inputRef.current?.click();
    }, []);

    const onInputChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files);
                e.target.value = "";
            }
        },
        [addFiles]
    );

    const onDownload = React.useCallback((item: SourceImage | ProcessedImage) => {
        if (!("blob" in item)) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(item.blob);
        link.download = item.file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    }, []);

    // Вычисляем количество готовых файлов
    const compressedItemsCount = React.useMemo(() => {
        return items.filter((item) => "blob" in item).length;
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
                    <span className="logo-text">ImageCompress</span>
                </div>
                <div className="settings">
                    <div className="setting-item">
                        <span className="checkmark">✓</span>
                        <span>Lossless Compression</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="hero">
                    <h1 className="hero-title">Compress Images Without Quality Loss</h1>
                    <p className="hero-description">
                        Reduce your JPG and PNG images size while maintaining perfect image quality.
                        <br />
                        Upload multiple images and download them individually.
                    </p>
                </div>

                <div className="upload-section">
                    <h3 className="upload-title">Upload Images</h3>
                    <div className={`upload-area ${isOver ? "dragover" : ""}`} onClick={onSelectClick}>
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
                            <h4>Drop images here or click to upload</h4>
                            <p>
                                Support for JPG and PNG files up to 5MB each. Files are compressed automatically after
                                upload.
                            </p>
                        </div>
                        <button className="choose-files-btn" onClick={onSelectClick}>
                            Choose Files
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            multiple
                            onChange={onInputChange}
                            style={{ display: "none" }}
                        />
                    </div>
                </div>

                {items.length > 0 && (
                    <div className="images-section">
                        <div className="images-header">
                            <h3>Uploaded Files ({items.length})</h3>
                            <div className="images-actions">
                                {compressedItemsCount > 0 && (
                                    <button className="btn-primary" onClick={downloadAll}>
                                        Download All ({compressedItemsCount})
                                    </button>
                                )}
                                <button className="btn-secondary" onClick={clearAll}>
                                    Clear All
                                </button>
                            </div>
                        </div>

                        <div className="uploaded-files">
                            {items.map((item) => {
                                const isCompressed = "blob" in item;
                                const isProcessing = processingIds.has(item.id);
                                const hasError = errorsById[item.id];
                                const compressionPercent = isCompressed
                                    ? Math.round((1 - item.compressedBytes / item.originalBytes) * 100)
                                    : 0;

                                return (
                                    <div className="file-card" key={item.id}>
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
                                                    <span>Compressing...</span>
                                                </div>
                                            )}
                                            {isCompressed && !isProcessing && (
                                                <div className="file-status">
                                                    <span className="status-icon">✓</span>
                                                    <span>Compressed successfully</span>
                                                </div>
                                            )}
                                            {hasError && !isProcessing && (
                                                <div className="file-status error-status">
                                                    <span className="status-icon">✕</span>
                                                    <span>Compression failed</span>
                                                </div>
                                            )}
                                            <div className="file-size">
                                                {formatBytes(item.originalBytes)} →{" "}
                                                {isCompressed ? formatBytes(item.compressedBytes) : "—"}
                                            </div>
                                        </div>

                                        <div className="file-actions">
                                            <div className="file-type-badge">
                                                {item.type === "image/png" ? "PNG" : "JPG"}
                                            </div>
                                            {isCompressed && !isProcessing && (
                                                <div className="compression-percent">-{compressionPercent}%</div>
                                            )}
                                            <div className="action-buttons">
                                                {isCompressed && !isProcessing ? (
                                                    <button className="download-btn" onClick={() => onDownload(item)}>
                                                        Download
                                                    </button>
                                                ) : (
                                                    <button className="download-btn" disabled>
                                                        {isProcessing ? "Processing..." : "Not compressed"}
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
                <p>© 2025 ImageCompress</p>
            </footer>
        </div>
    );
}
