# Менеджер Ресурсов

Веб-приложение для управления доступом к различным ресурсам с хранением учетных данных.

## Технологии

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **База данных**: SQLite (aiosqlite)

## Структура проекта

```
/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── App.jsx    # Главный компонент
│   │   ├── index.jsx  # Точка входа
│   │   └── index.css  # Стили
│   ├── package.json
│   └── vite.config.js
├── backend/            # FastAPI backend
│   ├── server.py       # API сервер
│   └── requirements.txt
└── start.sh           # Скрипт запуска

```

## Запуск

Приложение запускается автоматически через workflow `app`.

Frontend: http://localhost:5000
Backend API: http://localhost:8000

## Функционал

1. **Добавление ресурсов** - вручную через форму
2. **Импорт из файла** - загрузка ресурсов из файла формата `url:login:pass`
3. **Управление статусом** - включение/отключение ресурсов
4. **Быстрое подключение** - клик по строке открывает сайт и показывает данные для входа
5. **Копирование данных** - кнопки для копирования URL, логина и пароля

## API

- `GET /api/resources` - получить все ресурсы
- `POST /api/resources` - создать ресурс
- `PUT /api/resources/{id}` - обновить статус ресурса
- `DELETE /api/resources/{id}` - удалить ресурс
- `POST /api/resources/import` - импорт из файла

## База данных

SQLite база данных `resources.db` создается автоматически при первом запуске.

## Deployment

Приложение готово к публикации. Backend работает на localhost:8000, frontend на порту 5000.
