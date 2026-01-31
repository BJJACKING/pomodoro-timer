@echo off
echo ========================================
echo       番茄时钟项目启动器
echo ========================================
echo.
echo 项目位置: D:\work\pomodoro-timer\
echo.
echo 选择启动方式:
echo 1. 在默认浏览器中打开
echo 2. 在 Cursor 中打开项目
echo 3. 查看项目文件
echo 4. 退出
echo.

set /p choice="请选择 (1-4): "

if "%choice%"=="1" (
    echo 正在浏览器中打开番茄时钟...
    start index.html
) else if "%choice%"=="2" (
    echo 正在 Cursor 中打开项目...
    if exist "C:\Program Files\cursor\Cursor.exe" (
        start "" "C:\Program Files\cursor\Cursor.exe" "D:\work\pomodoro-timer"
    ) else (
        echo Cursor 未找到，请先安装 Cursor
    )
) else if "%choice%"=="3" (
    echo 打开项目文件夹...
    explorer "D:\work\pomodoro-timer"
) else if "%choice%"=="4" (
    exit
) else (
    echo 无效选择
    pause
)

echo.
echo 操作完成！
pause