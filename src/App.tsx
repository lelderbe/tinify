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
        <div className="container">
            <div className="header">
                <div className="title">Сжатие изображений (JPG/PNG)</div>
                <div className="row">
                    <button className="secondary" onClick={clearAll} disabled={items.length === 0}>
                        Очистить
                    </button>
                    <button className="primary" onClick={processAll} disabled={items.length === 0 || isProcessing}>
                        {isProcessing ? "Обработка…" : "Сжать"}
                    </button>
                </div>
            </div>

            <div
                className={`dropzone ${isOver ? "dragover" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div>
                    <div>Перетащите JPG/PNG сюда или выберите файлы</div>
                    <div className="hint">Формат сохраняется. Можно загружать несколько файлов.</div>
                    <div style={{ marginTop: 12 }}>
                        <button className="primary" onClick={onSelectClick}>
                            Выбрать файлы
                        </button>
                        <input
                            ref={inputRef}
                            className="hidden-input"
                            type="file"
                            accept="image/png,image/jpeg"
                            multiple
                            onChange={onInputChange}
                        />
                    </div>
                </div>
            </div>

            {items.length > 0 && (
                <div className="grid">
                    {items.map((item) => (
                        <div className="card" key={item.id}>
                            <div className="card-header">
                                <div className="name" title={item.file.name}>
                                    {item.file.name}
                                </div>
                                <div className="row">
                                    <span className="badge">{item.type === "image/png" ? "PNG" : "JPG"}</span>
                                    <button className="secondary" onClick={() => onRemove(item.id)}>
                                        Удалить
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <img className="preview" src={item.objectUrl} alt={item.file.name} />
                                <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
                                    <div className="meta">
                                        <div>
                                            Размер: {formatBytes(item.originalBytes)} →{" "}
                                            {"blob" in item ? formatBytes(item.compressedBytes) : "—"}
                                        </div>
                                        <div>
                                            Разрешение: {item.width}×{item.height}
                                        </div>
                                    </div>
                                    {"blob" in item ? (
                                        <button className="primary" onClick={() => onDownload(item)}>
                                            Скачать
                                        </button>
                                    ) : (
                                        <button className="secondary" disabled>
                                            Не сжато
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
            )}
        </div>
    );
}
