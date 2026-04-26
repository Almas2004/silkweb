# Silk Web

Лёгкий сайт Silk Web на Node.js с публичными страницами, Telegram-заявками и backend API для кейсов.

## Локальный запуск

```bash
npm start
```

Сайт поднимется на `http://localhost:3000` по умолчанию.

## Продакшен

Проект рассчитан на запуск через `systemd` на порте `8090`.

Файлы деплоя:

- `deploy/silkweb.service`
- `.github/workflows/deploy.yml`
- `deploy/deploy.sh`

## Как работает CI/CD

После push в ветку `main` GitHub Actions:

1. проверяет синтаксис `backend/server.js`
2. проверяет синтаксис `assets/app.js`
3. загружает проект на VPS в `/var/www/silkweb`
4. обновляет `/etc/silkweb/silkweb.env`
5. перезапускает сервис `silkweb`
6. делает health-check на `http://127.0.0.1:8090`

Есть и ручной запуск через `workflow_dispatch` в Actions.

## GitHub Secrets для CI/CD

Добавьте в репозиторий:

- `VPS_HOST`
- `VPS_USER`
- `VPS_PASSWORD`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `ADMIN_API_KEY`

## Что ещё нужно для полного запуска

Чтобы CI/CD заработал полностью, проект должен быть:

- загружен в отдельный GitHub-репозиторий
- привязан как `origin` в локальном git
- иметь указанные secrets в настройках GitHub

После этого любой push в `main` будет автоматически выкатывать сайт на VPS.
