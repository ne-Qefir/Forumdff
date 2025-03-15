# Инструкция по установке форума

## Системные требования
- Node.js v20 или выше
- MySQL Server 8.0 или выше
- Минимум 1GB оперативной памяти
- 10GB свободного места на диске

## Установка

1. Распакуйте архив в желаемую директорию

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения:
Создайте файл .env в корневой директории со следующим содержимым:
```
DATABASE_URL=mysql://user:password@host:port/database
CORS_ORIGIN=https://ваш-домен.com
```

4. Создайте папку uploads и установите права:
```bash
mkdir uploads
chmod 755 uploads
```

5. Соберите клиентскую часть:
```bash
npm run build
```

6. Запустите сервер:
```bash
npm start
```

## Настройка Nginx

Добавьте следующую конфигурацию в ваш nginx.conf:

```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /путь/к/папке/uploads;
        expires 1d;
        add_header Cache-Control "public, no-transform";
    }
}
```

## Проверка установки
1. Откройте форум в браузере
2. Зарегистрируйте нового пользователя
3. Проверьте загрузку аватарок
4. Создайте тестовую тему и комментарии

## Обслуживание
- Регулярно делайте резервные копии базы данных
- Следите за размером папки uploads
- Обновляйте зависимости npm

## Безопасность
- Используйте HTTPS
- Настройте межсетевой экран
- Регулярно обновляйте систему и зависимости
