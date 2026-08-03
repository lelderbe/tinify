# Tinify - Сжатие изображений

Веб-приложение для сжатия изображений без потери качества. Поддерживает JPG и PNG файлы с автоматическим сжатием через серверную обработку.

## ✨ Возможности

- 🖼️ **Поддержка форматов**: JPG и PNG изображения
- 🗜️ **Настраиваемое качество сжатия**: для JPG файлов (10-100%)
- 📁 **Drag & Drop**: Удобная загрузка файлов перетаскиванием
- 📦 **Множественная загрузка**: Обработка нескольких файлов одновременно
- 💾 **Скачивание**: Индивидуальное скачивание или все файлы в ZIP архиве
- 📊 **Статистика**: Отображение процента сжатия и размеров файлов
- ⚡ **Быстрая обработка**: Серверное сжатие с использованием Sharp.js
- 🗜️ **Автоматическое пересжатие** JPG при изменении качества
- 🎨 **Современный интерфейс**: Адаптивный UI с индикаторами прогресса

## Особенности качества JPG

- **Диапазон качества**: от 10% до 100%
- **По умолчанию**: 75% (оптимальный баланс между качеством и размером)
- **Автоматическое пересжатие**: при изменении качества существующие JPG файлы автоматически пересжимаются
- **Debounce**: пересжатие происходит с задержкой 500ms для избежания множественных запросов

## 🛠️ Технологии

### AI / Spec-Driven Development

- Проект создан при помощи Cursor
- **OpenSpec** (`@fission-ai/openspec@1.7.0`) — Spec-Driven Development (SDD): сначала спеки и план, потом код

### Frontend

- **React 18** с TypeScript
- **Vite** для сборки и разработки
- **JSZip** для создания архивов
- **CSS** для стилизации

### Backend

- **Express.js** сервер
- **Sharp** для обработки изображений
- **Multer** для загрузки файлов
- **CORS** для кросс-доменных запросов

## 🚀 Установка и запуск

### Предварительные требования

- **Node.js** версии **20.19.0** или выше (нужно и приложению, и OpenSpec CLI)

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd tinify
```

### 2. Установка зависимостей

```bash
npm i
```

После `npm i` в `node_modules/.bin` появится CLI OpenSpec той же версии, что зафиксирована в `package.json` (`1.7.0`). Так у всех участников команды одинаковый CLI.

Проверка:

```bash
npx openspec --version
# ожидается: 1.7.0
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

Эта команда одновременно запустит:

- **Frontend** на http://localhost:5173
- **Backend** на http://localhost:8787

### 4. Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут находиться в папке `dist/`.

### 5. Предварительный просмотр собранной версии

```bash
npm run preview
```

## 📋 Доступные скрипты

- `npm run dev` — запуск в режиме разработки (фронтенд + бэкенд)
- `npm run dev:client` — только фронтенд (Vite)
- `npm run dev:server` — только бэкенд (Express)
- `npm run build` — сборка для продакшена
- `npm run preview` — превью собранной версии
- `npm run openspec` — OpenSpec CLI (локальная версия из `devDependencies`)
- `npm run openspec:update` — обновить сгенерированные skills/commands под текущий CLI

## 🎯 Использование

1. **Откройте приложение** в браузере по адресу http://localhost:5173
2. **Загрузите изображения** одним из способов:
    - Перетащите файлы на страницу
    - Нажмите "Выбрать изображения" для выбора файлов
3. **Дождитесь обработки** - файлы автоматически сжимаются после загрузки
4. **Скачайте результат**:
    - Индивидуально каждый файл кнопкой "Скачать"
    - Все файлы сразу кнопкой "Скачать все" (создается ZIP архив)

## 📁 Структура проекта

```
tinify/
├── .cursor/
│   ├── commands/          # Slash-команды OpenSpec для Cursor (/opsx-*)
│   └── skills/            # Skills OpenSpec (коммитятся в репозиторий)
├── openspec/
│   ├── config.yaml        # Контекст проекта и правила для артефактов
│   ├── specs/             # Source of truth: поведение системы
│   └── changes/           # Активные и архивные change-предложения
├── src/                   # Исходный код фронтенда
│   ├── App.tsx            # Главный компонент
│   ├── index.tsx          # Точка входа
│   ├── styles.css         # Стили
│   ├── hooks/             # React хуки
│   │   ├── useImages.ts   # Логика работы с изображениями
│   │   └── useDrop.ts     # Логика drag & drop
│   └── lib/               # Утилиты
│       ├── jpgQuality.ts  # localStorage для jpgQuality
│       └── image.ts       # Типы и функции для изображений
├── server/                # Серверная часть
│   └── server.ts          # Express сервер
├── shared/                # Общие файлы
│   └── constants.ts       # Константы приложения
├── index.html
├── package.json
└── vite.config.ts
```

## 🧭 OpenSpec (Spec-Driven Development)

Разработка фич идёт через спеки: сначала согласовываем **что** меняем, потом пишем код.

### Что лежит в репозитории (для команды)

| Путь | Назначение |
|------|------------|
| `openspec/config.yaml` | Контекст стека, доменные правила, правила артефактов |
| `openspec/specs/` | Актуальные спеки поведения системы |
| `openspec/changes/` | Предложения изменений (proposal / design / tasks / delta-specs) |
| `.cursor/skills/openspec-*` | Skills для агента Cursor |
| `.cursor/commands/opsx-*.md` | Slash-команды Cursor |

CLI **не** ставится глобально обязательно: версия зафиксирована в `devDependencies` как `@fission-ai/openspec@1.7.0`, чтобы у всех участников была одна и та же версия.

### Команды в Cursor

После клона и `npm i` перезапусти Cursor (или Reload Window), чтобы подхватились skills/commands.

| Команда | Когда использовать |
|---------|-------------------|
| `/opsx-explore` | Обдумать идею, разобрать проблему, сравнить варианты |
| `/opsx-propose` | Создать change и артефакты (proposal, specs, design, tasks) |
| `/opsx-apply` | Реализовать задачи из `tasks.md` |
| `/opsx-update` | Обновить артефакты change, если план изменился |
| `/opsx-sync` | Синхронизировать delta-спеки в `openspec/specs/` |
| `/opsx-archive` | Заархивировать завершённый change |

Типичный цикл:

```text
/opsx-explore  →  /opsx-propose "add-webp-support"  →  /opsx-apply  →  /opsx-archive
```

### CLI из терминала

```bash
npx openspec --version
npx openspec status
npx openspec list
npx openspec validate
npm run openspec:update   # после апгрейда CLI — обновить skills/commands и закоммитить
```

### Обновление OpenSpec в команде

1. Поднять версию в `package.json` (`devDependencies.@fission-ai/openspec`).
2. `npm i`
3. `npm run openspec:update`
4. Закоммитить обновлённые `.cursor/skills`, `.cursor/commands` и `package-lock.json`.
5. Остальные участники делают `npm i` — получают ту же версию CLI и те же skills.

Документация: [OpenSpec Getting Started](https://openspec.dev/docs/getting-started), [Installation](https://openspec.dev/docs/installation).

## ⚙️ API Endpoints

### `POST /api/compress`

Сжатие изображения.

**Параметры:**

- `file` (multipart/form-data) - Изображение для сжатия (max 10MB)

**Ответ:**

- Сжатое изображение в бинарном формате

**Пример использования:**

```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/compress', {
    method: 'POST',
    body: formData,
});

const compressedBlob = await response.blob();
```

### `GET /api/health`

Проверка состояния сервера.

**Ответ:**

```json
{
    "ok": true
}
```

## 🔧 Настройки сжатия по умолчанию

### JPG изображения

- **Качество**: 75%
- **MozJPEG**: Включен для лучшего сжатия
- **Progressive**: Включен
- **Цветовая субдискретизация**: 4:2:0

### PNG изображения

- **Уровень сжатия**: 9 (максимальный)
- **Усилие**: 10 (максимальное)
- **Progressive**: Отключен
- **Адаптивная фильтрация**: Отключена

## 🚨 Ограничения

- Максимальный размер файла: **10MB**
- Поддерживаемые форматы: **JPG, PNG**
- Серверное сжатие требует доступности backend API

## 🤝 Разработка

- **OpenSpec / SDD** — изменения через `/opsx-propose` → `/opsx-apply` → `/opsx-archive`
- **TypeScript** для типобезопасности
- **React Hooks** для управления состоянием
- **CSS Custom Properties** для стилизации
- **Express.js** для легковесного сервера
- **Sharp** для высокопроизводительной обработки изображений

## 📝 Лицензия

© 2025 Tinify
