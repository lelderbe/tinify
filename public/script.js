// Глобальные переменные
let selectedFiles = [];
let compressionResults = [];

// DOM элементы
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const compressBtn = document.getElementById('compressBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const previewSection = document.getElementById('previewSection');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const statsSection = document.getElementById('statsSection');
const totalFiles = document.getElementById('totalFiles');
const totalSaved = document.getElementById('totalSaved');
const averageCompression = document.getElementById('averageCompression');
const notificationsContainer = document.getElementById('notifications');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    console.log('🚀 ImageCompress Pro инициализирован');
});

// Инициализация обработчиков событий
function initializeEventListeners() {
    // Drag & Drop события
    uploadArea.addEventListener('dragenter', handleDragEnter);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Клик по области загрузки
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Выбор файлов через input
    fileInput.addEventListener('change', handleFileSelect);
    
    // Кнопки управления
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    compressBtn.addEventListener('click', handleCompress);
    clearAllBtn.addEventListener('click', handleClearAll);
    downloadAllBtn.addEventListener('click', handleDownloadAll);
}

// Обработчики Drag & Drop
function handleDragEnter(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    // Проверяем, что мы действительно покинули область
    if (!uploadArea.contains(e.relatedTarget)) {
        uploadArea.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

// Обработка выбора файлов
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

// Обработка файлов
function processFiles(files) {
    const validFiles = files.filter(file => {
        const isValid = (file.type === 'image/jpeg' || file.type === 'image/png') && 
                       file.size <= 10 * 1024 * 1024; // 10MB
        
        if (!isValid) {
            if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
                showNotification(`Файл "${file.name}" не поддерживается. Только JPG и PNG.`, 'error');
            } else if (file.size > 10 * 1024 * 1024) {
                showNotification(`Файл "${file.name}" слишком большой. Максимум 10MB.`, 'error');
            }
        }
        
        return isValid;
    });

    if (validFiles.length === 0) {
        showNotification('Не выбрано подходящих файлов', 'error');
        return;
    }

    // Проверяем общее количество файлов
    if (selectedFiles.length + validFiles.length > 10) {
        const allowedCount = 10 - selectedFiles.length;
        validFiles.splice(allowedCount);
        showNotification(`Можно загрузить максимум 10 файлов. Добавлено ${allowedCount} файлов.`, 'info');
    }

    // Добавляем файлы к уже выбранным
    selectedFiles.push(...validFiles);
    
    // Обновляем интерфейс
    updatePreview();
    updateButtons();
    
    showNotification(`Добавлено ${validFiles.length} файлов`, 'success');
}

// Обновление предварительного просмотра
function updatePreview() {
    filePreviewContainer.innerHTML = '';
    
    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        return;
    }
    
    previewSection.style.display = 'block';
    
    selectedFiles.forEach((file, index) => {
        const filePreview = document.createElement('div');
        filePreview.className = 'file-preview';
        
        // Создаем превью изображения
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        img.onload = () => URL.revokeObjectURL(img.src); // Освобождаем память
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name.length > 20 ? 
            file.name.substring(0, 20) + '...' : file.name;
        fileName.title = file.name;
        
        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        
        // Кнопка удаления
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.className = 'btn btn-secondary btn-small';
        removeBtn.style.marginTop = '0.5rem';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFile(index);
        };
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        
        filePreview.appendChild(img);
        filePreview.appendChild(fileInfo);
        filePreview.appendChild(removeBtn);
        
        filePreviewContainer.appendChild(filePreview);
    });
}

// Удаление файла из списка
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updatePreview();
    updateButtons();
    
    if (selectedFiles.length === 0) {
        showNotification('Все файлы удалены', 'info');
    }
}

// Обновление состояния кнопок
function updateButtons() {
    const hasFiles = selectedFiles.length > 0;
    compressBtn.disabled = !hasFiles;
    clearAllBtn.disabled = !hasFiles;
}

// Очистка всех файлов
function handleClearAll() {
    selectedFiles = [];
    compressionResults = [];
    updatePreview();
    updateButtons();
    hideAllSections();
    showNotification('Все файлы удалены', 'info');
}

// Скрытие всех секций результатов
function hideAllSections() {
    progressSection.style.display = 'none';
    resultsSection.style.display = 'none';
    statsSection.style.display = 'none';
}

// Сжатие изображений
async function handleCompress() {
    if (selectedFiles.length === 0) {
        showNotification('Выберите файлы для сжатия', 'error');
        return;
    }

    // Показываем прогресс
    showProgress();
    
    try {
        // Создаем FormData
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('images', file);
        });

        // Отправляем запрос
        const response = await fetch('/api/compress', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            compressionResults = result.results;
            displayResults();
            updateStats();
            showNotification(`✅ Успешно обработано ${result.results.length} изображений`, 'success');
        } else {
            throw new Error(result.error || 'Неизвестная ошибка');
        }

    } catch (error) {
        console.error('Ошибка при сжатии:', error);
        showNotification(`Ошибка при сжатии: ${error.message}`, 'error');
        hideProgress();
    }
}

// Показ прогресса
function showProgress() {
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    statsSection.style.display = 'none';
    
    // Анимируем прогресс-бар
    progressFill.style.width = '0%';
    progressText.textContent = 'Загрузка файлов...';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        
        progressFill.style.width = progress + '%';
        
        if (progress < 30) {
            progressText.textContent = 'Загрузка файлов...';
        } else if (progress < 60) {
            progressText.textContent = 'Сжатие изображений...';
        } else {
            progressText.textContent = 'Завершение обработки...';
        }
    }, 100);

    // Сохраняем интервал для остановки
    progressSection.dataset.interval = interval;
}

// Скрытие прогресса
function hideProgress() {
    const interval = progressSection.dataset.interval;
    if (interval) {
        clearInterval(interval);
    }
    progressSection.style.display = 'none';
}

// Завершение прогресса
function completeProgress() {
    const interval = progressSection.dataset.interval;
    if (interval) {
        clearInterval(interval);
    }
    
    progressFill.style.width = '100%';
    progressText.textContent = 'Готово!';
    
    setTimeout(() => {
        hideProgress();
    }, 1000);
}

// Отображение результатов
function displayResults() {
    completeProgress();
    
    resultsSection.style.display = 'block';
    statsSection.style.display = 'block';
    
    resultsContainer.innerHTML = '';
    
    compressionResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const resultInfo = document.createElement('div');
        resultInfo.className = 'result-info';
        
        const title = document.createElement('h4');
        title.textContent = result.originalName;
        
        const stats = document.createElement('div');
        stats.className = 'result-stats';
        
        const originalSize = document.createElement('span');
        originalSize.textContent = `Исходный: ${formatFileSize(result.originalSize)}`;
        
        const compressedSize = document.createElement('span');
        compressedSize.textContent = `Сжатый: ${formatFileSize(result.compressedSize)}`;
        
        const compressionRatio = document.createElement('span');
        compressionRatio.className = 'compression-ratio';
        compressionRatio.textContent = `Сжато: ${result.compressionRatio}%`;
        
        stats.appendChild(originalSize);
        stats.appendChild(compressedSize);
        stats.appendChild(compressionRatio);
        
        resultInfo.appendChild(title);
        resultInfo.appendChild(stats);
        
        // Действия
        const resultActions = document.createElement('div');
        resultActions.className = 'result-actions';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-primary btn-small';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Скачать';
        downloadBtn.onclick = () => downloadFile(result);
        
        resultActions.appendChild(downloadBtn);
        
        resultItem.appendChild(resultInfo);
        resultItem.appendChild(resultActions);
        
        resultsContainer.appendChild(resultItem);
    });
}

// Обновление статистики
function updateStats() {
    const totalFilesCount = compressionResults.length;
    const totalSavedBytes = compressionResults.reduce((sum, result) => 
        sum + (result.originalSize - result.compressedSize), 0);
    const avgCompression = compressionResults.reduce((sum, result) => 
        sum + parseFloat(result.compressionRatio), 0) / totalFilesCount;

    totalFiles.textContent = totalFilesCount;
    totalSaved.textContent = formatFileSize(totalSavedBytes);
    averageCompression.textContent = avgCompression.toFixed(1) + '%';
}

// Скачивание одного файла
async function downloadFile(result) {
    try {
        const filename = result.downloadUrl.split('/').pop();
        const response = await fetch(`/api/download/${filename}`);
        
        if (!response.ok) {
            throw new Error('Файл не найден');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = result.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification(`Файл "${result.originalName}" скачан`, 'success');
        
    } catch (error) {
        console.error('Ошибка при скачивании:', error);
        showNotification(`Ошибка при скачивании: ${error.message}`, 'error');
    }
}

// Скачивание всех файлов
async function handleDownloadAll() {
    if (compressionResults.length === 0) {
        showNotification('Нет файлов для скачивания', 'error');
        return;
    }

    showNotification('Начинается скачивание всех файлов...', 'info');

    for (const result of compressionResults) {
        try {
            await downloadFile(result);
            // Небольшая задержка между скачиваниями
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
        }
    }

    showNotification('Все файлы скачаны!', 'success');
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Б';
    
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsContainer.appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Ограничиваем количество уведомлений
    const notifications = notificationsContainer.children;
    if (notifications.length > 5) {
        notifications[0].remove();
    }
}

// Дополнительные функции для улучшения UX
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    const files = [];
    
    for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) files.push(file);
        }
    }
    
    if (files.length > 0) {
        e.preventDefault();
        processFiles(files);
        showNotification(`Вставлено ${files.length} изображений из буфера обмена`, 'info');
    }
});

// Предотвращение стандартного поведения при перетаскивании файлов на страницу
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    if (!uploadArea.contains(e.target)) {
        e.preventDefault();
    }
});

// Обработка ошибок глобально
window.addEventListener('error', (e) => {
    console.error('Глобальная ошибка:', e.error);
    showNotification('Произошла ошибка в приложении', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Необработанное отклонение промиса:', e.reason);
    showNotification('Ошибка при обработке запроса', 'error');
});

console.log('✅ Все обработчики событий настроены');