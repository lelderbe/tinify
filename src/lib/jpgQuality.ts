import { DEFAULT_JPG_QUALITY, MAX_JPG_QUALITY, MIN_JPG_QUALITY } from '../../shared/constants';

export const parseJpgQuality = (value: string): number => {
    try {
        const parsedValue = parseInt(value, 10);
        // Проверяем, что значение в допустимом диапазоне
        if (parsedValue >= MIN_JPG_QUALITY && parsedValue <= MAX_JPG_QUALITY) {
            return parsedValue;
        }
    } catch (error) {
        console.warn('Не удалось загрузить jpgQuality из localStorage:', error);
    }
    return DEFAULT_JPG_QUALITY;
};
