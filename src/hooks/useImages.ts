import React from "react";
import JSZip from "jszip";
import {
    formatBytes,
    readImageFile,
    recompressImage,
    type ProcessedImage,
    type SourceImage,
    isSupportedFile,
} from "../lib/image";

export function useImages() {
    const [items, setItems] = React.useState<Array<SourceImage | ProcessedImage>>([]);
    const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());
    const [errorsById, setErrorsById] = React.useState<Record<string, string>>({});

    const addFiles = React.useCallback(async (files: FileList | File[]) => {
        const supportedFiles = Array.from(files).filter(isSupportedFile);
        const loaded = await Promise.all(supportedFiles.map(readImageFile));

        // Добавляем файлы сначала как исходные
        setItems((prev) => [...loaded, ...prev]);

        // Автоматически сжимаем каждый файл
        for (const item of loaded) {
            setProcessingIds((prev) => new Set(prev).add(item.id));
            try {
                const compressed = await recompressImage(item);
                setItems((prevItems) => prevItems.map((prevItem) => (prevItem.id === item.id ? compressed : prevItem)));
                setErrorsById((prev) => {
                    const next = { ...prev };
                    delete next[item.id];
                    return next;
                });
            } catch (err) {
                setErrorsById((prev) => ({
                    ...prev,
                    [item.id]: "Не удалось сжать. Сервер недоступен или произошла ошибка.",
                }));
            } finally {
                setProcessingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(item.id);
                    return next;
                });
            }
        }
    }, []);

    const clearAll = React.useCallback(() => {
        setItems((prev) => {
            prev.forEach((i) => URL.revokeObjectURL(i.objectUrl));
            return [];
        });
        setErrorsById({});
        setProcessingIds(new Set());
    }, []);

    const downloadAll = React.useCallback(async () => {
        const compressedItems = items.filter((item): item is ProcessedImage => "blob" in item);

        if (compressedItems.length === 0) return;

        const zip = new JSZip();

        // Добавляем каждый сжатый файл в архив
        compressedItems.forEach((item) => zip.file(item.file.name, item.blob));

        // Создаем и скачиваем zip архив
        try {
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipBlob);
            link.download = "tinified.zip";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(link.href), 2000);
        } catch (error) {
            console.error("Ошибка при создании архива:", error);
        }
    }, [items]);

    const clearError = React.useCallback((id: string) => {
        setErrorsById((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    }, []);

    return { items, addFiles, clearAll, downloadAll, setItems, errorsById, clearError, setErrorsById, processingIds };
}
