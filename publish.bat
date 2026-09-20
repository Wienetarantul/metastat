@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PATH=%PATH%;C:\Program Files\GitHub CLI
set HTTPS_PROXY=http://127.0.0.1:7890
echo Отправляю изменения на GitHub — сборка и публикация пройдут сами.
git add -A
git commit -m "Обновление MetaStat" || echo Нечего коммитить.
git push origin main || goto :err
echo.
echo Готово. Через 1-2 минуты обновится https://wienetarantul.github.io/metastat/
pause
exit /b 0
:err
echo Не получилось отправить. Покажи это окно Клоду.
pause
exit /b 1
