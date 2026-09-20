@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Приложение живёт на https://wienetarantul.github.io/metastat/ и работает всегда.
echo Этот файл запускает только бота (команды /me, /link, /player).
echo.
npm run bot
pause
