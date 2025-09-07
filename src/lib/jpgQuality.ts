import { DEFAULT_JPG_QUALITY, MAX_JPG_QUALITY, MIN_JPG_QUALITY } from '../../shared/constants';

// Функции для работы с localStorage
export const getStoredJpgQuality = (): number => {
    try {
        const stored = localStorage.getItem('jpgQuality');
        if (stored) {
            const value = parseInt(stored, 10);
            // Проверяем, что значение в допустимом диапазоне
            if (value >= MIN_JPG_QUALITY && value <= MAX_JPG_QUALITY) {
                return value;
            }
        }
    } catch (error) {
        console.warn('Не удалось загрузить jpgQuality из localStorage:', error);
    }
    return DEFAULT_JPG_QUALITY; // значение по умолчанию
};

export const setStoredJpgQuality = (value: number): void => {
    try {
        localStorage.setItem('jpgQuality', value.toString());
    } catch (error) {
        console.warn('Не удалось сохранить jpgQuality в localStorage:', error);
    }
};
