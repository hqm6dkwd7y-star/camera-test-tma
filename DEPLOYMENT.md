# 🚀 Инструкция по деплою Camera Test TMA

## Вариант 1: GitHub Pages (Рекомендуется)

### Шаг 1: Подготовка проекта

```bash
cd camera-test-tma
npm install
npm run build
```

### Шаг 2: Создание репозитория

1. Создайте репозиторий на GitHub: `camera-test-tma`
2. Сделайте его Public

### Шаг 3: Загрузка кода

```bash
git init
git add .
git commit -m "Initial commit: Camera Test TMA"
git remote add origin https://github.com/YOUR_USERNAME/camera-test-tma.git
git branch -M main
git push -u origin main
```

### Шаг 4: Настройка GitHub Pages

1. Перейдите в Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: **main** → Folder: **/dist**
4. Save

Подождите 2-3 минуты.

### Шаг 5: Получите URL

URL будет: `https://YOUR_USERNAME.github.io/camera-test-tma/`

### Шаг 6: Настройка в @BotFather

1. Откройте @BotFather
2. `/newapp`
3. Выберите бота
4. Введите URL: `https://YOUR_USERNAME.github.io/camera-test-tma/`

---

## Вариант 2: Vercel (Альтернатива)

### Шаг 1: Установка Vercel CLI

```bash
npm install -g vercel
```

### Шаг 2: Деплой

```bash
cd camera-test-tma
vercel
```

Следуйте инструкциям в терминале.

### Шаг 3: Получите URL

Vercel автоматически даст вам URL вида: `https://camera-test-tma.vercel.app`

---

## Вариант 3: Локально с ngrok (Для тестирования)

### Шаг 1: Установка ngrok

**macOS:**
```bash
brew install ngrok/ngrok/ngrok
```

**Или скачайте:** https://ngrok.com/download

### Шаг 2: Регистрация

1. Зарегистрируйтесь на https://ngrok.com
2. Получите authtoken
3. Выполните:
```bash
ngrok authtoken YOUR_TOKEN
```

### Шаг 3: Запуск

Терминал 1 - Frontend:
```bash
cd camera-test-tma
npm run dev
```

Терминал 2 - ngrok:
```bash
ngrok http 3000
```

Терминал 3 - Backend:
```bash
cd camera-test-tma/server
python test_server.py
```

Терминал 4 - ngrok для backend:
```bash
ngrok http 8000
```

### Шаг 4: Настройка

1. Скопируйте HTTPS URL из ngrok (для frontend)
2. В `app.js` замените `serverUrl` на HTTPS URL backend из ngrok
3. Используйте frontend URL в @BotFather

---

## Деплой Backend сервера

### Вариант A: Railway.app (Бесплатно)

1. Зарегистрируйтесь на https://railway.app
2. New Project → Deploy from GitHub
3. Выберите репозиторий
4. Railway автоматически определит Python
5. Добавьте переменную окружения: `PORT=8000`
6. Deploy

### Вариант B: Render.com (Бесплатно)

1. Зарегистрируйтесь на https://render.com
2. New → Web Service
3. Connect GitHub репозиторий
4. Build Command: `cd server && pip install -r requirements.txt`
5. Start Command: `cd server && uvicorn test_server:app --host 0.0.0.0 --port $PORT`
6. Create Web Service

### Вариант C: VPS (DigitalOcean, AWS, etc.)

```bash
# На сервере
git clone https://github.com/YOUR_USERNAME/camera-test-tma.git
cd camera-test-tma/server

# Установка зависимостей
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Запуск с ��омощью systemd
sudo nano /etc/systemd/system/camera-test-server.service
```

Содержимое файла:
```ini
[Unit]
Description=Camera Test TMA Server
After=network.target

[Service]
User=YOUR_USER
WorkingDirectory=/path/to/camera-test-tma/server
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/uvicorn test_server:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl enable camera-test-server
sudo systemctl start camera-test-server
sudo systemctl status camera-test-server
```

### Настройка HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Обновление приложения

### GitHub Pages

```bash
npm run build
git add dist/
git commit -m "Update build"
git push
```

Подождите 2-3 минуты.

### Vercel

```bash
vercel --prod
```

### ngrok

Просто перезапустите ngrok - URL изменится!

---

## Проверка работы

1. Откройте URL в браузере - должна открыться страница
2. Откройте консоль браузера (F12)
3. Проверьте логи инициализации
4. Откройте в Telegram Mini App
5. Разрешите доступ к камере
6. Запишите видео
7. Отправьте на сервер
8. Проверьте папку `test_videos/` на сервере

---

## Troubleshooting

### Приложение не открывается в Telegram

- Проверьте, что URL правильный в @BotFather
- Убедитесь, что сайт доступен по HTTPS
- Откройте URL в браузере - должна открыться страница

### Камера не работает

- Проверьте HTTPS соединение
- Проверьте разрешения в браузере
- Откройте консоль и посмотрите ошибки

### Видео не отправляется на сервер

- Проверьте, что сервер запущен
- Проверьте URL сервера в `app.js`
- Проверьте CORS настройки на сервере
- Откройте консоль и посмотрите ошибки

### GitHub Pages не обновляется

- Подождите 5 минут
- Очистите кеш браузера (Ctrl+Shift+R)
- Проверьте Actions в GitHub - должен быть успешный deploy

---

## Полезные команды

```bash
# Проверить порты
lsof -i :3000
lsof -i :8000

# Убить процесс на порту
kill -9 $(lsof -t -i:3000)

# Проверить логи сервера
tail -f server/test_videos/*.log

# Очистить кеш npm
npm cache clean --force

# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install
```

---

**Готово!** Ваше приложение развернуто и готово к тестированию! 🚀
