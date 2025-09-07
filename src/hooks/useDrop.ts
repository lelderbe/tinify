import React from 'react';

export function useDrop(onFiles: (files: FileList | File[]) => void) {
    const [isOver, setIsOver] = React.useState(false);
    const dragCounterRef = React.useRef(0);

    const onDragEnter = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;

        // Проверяем, что перетаскиваются файлы
        if (e.dataTransfer.types.includes('Files')) {
            setIsOver(true);
        }
    }, []);

    const onDragOver = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Проверяем, что перетаскиваются файлы
        if (e.dataTransfer.types.includes('Files')) {
            setIsOver(true);
        }
    }, []);

    const onDragLeave = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;

        // Скрываем оверлей только когда все drag события завершены
        if (dragCounterRef.current === 0) {
            setIsOver(false);
        }
    }, []);

    const onDrop = React.useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = 0;
            setIsOver(false);

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                onFiles(files);
            }
        },
        [onFiles]
    );

    return { isOver, onDrop, onDragOver, onDragEnter, onDragLeave };
}
