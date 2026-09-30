@echo off
rem =========================================================================
rem  RepairCenter - Deinstallation
rem  Entfernt Programm, Verknuepfungen, Registrierung und Aufgabe.
rem  Berichte unter C:\RepairLogs bleiben erhalten.
rem  MIT-Lizenz - Copyright (c) 2026 AOWD GENESIS
rem =========================================================================
setlocal
set "PSEXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PSEXE%" set "PSEXE=powershell.exe"

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    "%PSEXE%" -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b 0
)

set "DEST=%ProgramFiles%\RepairCenter"

echo.
echo   RepairCenter wird entfernt ...

schtasks /Delete /TN "RepairCenter\Woechentliche Wartung" /F >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\RepairCenter" /f >nul 2>&1

"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -Command ^
  "Remove-Item -LiteralPath (Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\RepairCenter') -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "Remove-Item -LiteralPath (Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'RepairCenter.lnk') -Force -ErrorAction SilentlyContinue"

rem Programmordner zuletzt entfernen (dieses Skript liegt darin)
start "" /min cmd /c "timeout /t 2 >nul & rmdir /S /Q ""%DEST%"""

echo   Fertig. Die Berichte unter C:\RepairLogs wurden bewusst behalten.
echo.
pause
exit /b 0
