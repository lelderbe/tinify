import React from "react";
import {
    formatBytes,
    readImageFile,
    recompressImageLossless,
    type ProcessedImage,
    type SourceImage,
    isSupportedFile,
} from "./lib/image";

function useImages() {
    const [items, setItems] = React.useState<Array<SourceImage | ProcessedImage>>([]);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [errorsById, setErrorsById] = React.useState<Record<string, string>>({});

    const addFiles = React.useCallback(async (files: FileList | File[]) => {
        const supportedFiles = Array.from(files).filter(isSupportedFile);
        const loaded = await Promise.all(supportedFiles.map(readImageFile));
        setItems((prev) => [...prev, ...loaded]);
    }, []);

    const clearAll = React.useCallback(() => {
        setItems((prev) => {
            prev.forEach((i) => URL.revokeObjectURL(i.objectUrl));
            return [];
        });
        setErrorsById({});
    }, []);

    const processAll = React.useCallback(async () => {
        setIsProcessing(true);
        try {
            const nextErrors: Record<string, string> = { ...errorsById };
            const processed: Array<SourceImage | ProcessedImage> = [];
            for (const item of items) {
                try {
                    const out = await recompressImageLossless(item as SourceImage);
                    processed.push(out);
                    delete nextErrors[item.id];
                } catch (err) {
                    processed.push(item);
                    nextErrors[item.id] = "Не удалось сжать. Сервер недоступен или произошла ошибка.";
                }
            }
            setItems(processed);
            setErrorsById(nextErrors);
        } finally {
            setIsProcessing(false);
        }
    }, [items, errorsById]);

    const clearError = React.useCallback((id: string) => {
        setErrorsById((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    }, []);

    return { items, addFiles, clearAll, processAll, isProcessing, setItems, errorsById, clearError, setErrorsById };
}

function useDrop(onFiles: (files: FileList | File[]) => void) {
    const [isOver, setIsOver] = React.useState(false);

    const onDrop = React.useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOver(false);
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                onFiles(files);
            }
        },
        [onFiles]
    );

    const onDragOver = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(true);
    }, []);

    const onDragLeave = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
    }, []);

    return { isOver, onDrop, onDragOver, onDragLeave };
}

export default function App() {
    const { items, addFiles, clearAll, processAll, isProcessing, setItems, errorsById, clearError, setErrorsById } =
        useImages();
    const { isOver, onDrop, onDragOver, onDragLeave } = useDrop(addFiles);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const onSelectClick = React.useCallback(() => {
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
        const ext = item.type === "image/png" ? "png" : "jpg";
        const name = item.file.name.replace(/\.(png|jpg|jpeg)$/i, "") + `-optimized.${ext}`;
        link.href = URL.createObjectURL(item.blob);
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    }, []);

    const onRemove = React.useCallback(
        (id: string) => {
            setItems((prev) => {
                const target = prev.find((i) => i.id === id);
                if (target) {
                    URL.revokeObjectURL(target.objectUrl);
                }
                const next = prev.filter((i) => i.id !== id);
                return next;
            });
            setErrorsById((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        },
        [setItems, setErrorsById]
    );

    return (
        <div className="app">
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
                    <div className="setting-item">
                        <span className="cross">✕</span>
                        <span>No Upload to Server</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="hero">
                    <h1 className="hero-title">Combine Images Without Quality Loss</h1>
                    <p className="hero-description">
                        Reduce your JPG and PNG file sizes while maintaining perfect image quality.
                        <br />
                        Upload multiple images and download them individually.
                    </p>
                </div>

                <div className="upload-section">
                    <h3 className="upload-title">Upload Images</h3>
                    <div
                        className={`upload-area ${isOver ? "dragover" : ""}`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    >
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
                            <p>Support for JPG and PNG files up to 10MB each. Compression starts automatically.</p>
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
                            <h3>Uploaded Images ({items.length})</h3>
                            <div className="images-actions">
                                <button className="btn-secondary" onClick={clearAll}>
                                    Clear All
                                </button>
                                <button className="btn-primary" onClick={processAll} disabled={isProcessing}>
                                    {isProcessing ? "Processing..." : "Compress All"}
                                </button>
                            </div>
                        </div>

                        <div className="images-grid">
                            {items.map((item) => (
                                <div className="image-card" key={item.id}>
                                    <div className="card-header">
                                        <div className="name" title={item.file.name}>
                                            {item.file.name}
                                        </div>
                                        <div className="row">
                                            <span className="badge">{item.type === "image/png" ? "PNG" : "JPG"}</span>
                                            <button className="btn-secondary" onClick={() => onRemove(item.id)}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <img className="preview" src={item.objectUrl} alt={item.file.name} />
                                        <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
                                            <div className="meta">
                                                <div>
                                                    Size: {formatBytes(item.originalBytes)} →{" "}
                                                    {"blob" in item ? formatBytes(item.compressedBytes) : "—"}
                                                </div>
                                                <div>
                                                    Resolution: {item.width}×{item.height}
                                                </div>
                                            </div>
                                            {"blob" in item ? (
                                                <button className="btn-primary" onClick={() => onDownload(item)}>
                                                    Download
                                                </button>
                                            ) : (
                                                <button className="btn-secondary" disabled>
                                                    Not compressed
                                                </button>
                                            )}
                                        </div>
                                        {errorsById[item.id] && (
                                            <div className="error" onClick={() => clearError(item.id)}>
                                                {errorsById[item.id]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <p>
                    © 2024 ImageCompress. All processing happens locally in your browser.{" "}
                    <a href="#" className="privacy-link">
                        Your privacy is guaranteed.
                    </a>
                </p>
            </footer>
        </div>
    );
}
