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

## GitHub Secrets для CI/CD

Добавьте в репозиторий:

- `VPS_HOST`
- `VPS_USER`
- `VPS_PASSWORD`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

После этого push в `main` будет выкатывать проект на VPS.
