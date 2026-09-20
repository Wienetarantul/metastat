@echo off
chcp 65001 >nul
cd /d "%~dp0"
setlocal enabledelayedexpansion

echo [1/4] Собираю приложение...
call npm --prefix webapp run build || goto :err

echo [2/4] Запускаю локальный сервер на порту 4173...
start "MetaStat app" /min cmd /c "npm --prefix webapp run preview -- --port 4173 1>app.log 2>&1"
timeout /t 6 >nul

echo [3/4] Поднимаю туннель...
if exist tunnel.log del tunnel.log
start "MetaStat tunnel" /min cmd /c "ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -p 443 -R metastat:80:localhost:4173 serveo.net 1>tunnel.log 2>&1"
timeout /t 12 >nul

set URL=
for /f "tokens=5" %%L in ('findstr /c:"Forwarding HTTP traffic from" tunnel.log') do set URL=%%L
if "!URL!"=="" (
  echo Туннель не поднялся. Открой tunnel.log и покажи его Клоду.
  goto :err
)
echo Адрес приложения: !URL!

echo [4/4] Прописываю адрес в .env и запускаю бота...
> .env.new (
  for /f "usebackq tokens=1* delims==" %%A in (".env") do (
    if /i "%%A"=="WEBAPP_URL" (echo WEBAPP_URL=!URL!) else (echo %%A=%%B)
  )
)
move /y .env.new .env >nul
start "MetaStat bot" /min cmd /c "npm run bot 1>bot.log 2>&1"
timeout /t 4 >nul
echo.
echo Готово. Открывай бота в Telegram: @Metastatz_bot
echo Это окно можно закрыть, но окна "MetaStat app", "tunnel" и "bot" должны остаться открытыми.
pause
exit /b 0

:err
echo.
echo Что-то пошло не так. Покажи Клоду файлы app.log / tunnel.log / bot.log
pause
exit /b 1
