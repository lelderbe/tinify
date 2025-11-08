import { useEffect, useState } from 'react';

export function useLocalStorage(key: string, defaultValue: any, onGetItem?: (value: string) => any) {
    const [value, setValue] = useState(() => {
        const storedValue = localStorage.getItem(key);

        if (storedValue === null) {
            return defaultValue;
        }

        try {
            const parsedValue = onGetItem ? onGetItem(storedValue) : JSON.parse(storedValue);
            return parsedValue;
        } catch (error) {
            return defaultValue;
        }
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [value]);

    return [value, setValue];
}
