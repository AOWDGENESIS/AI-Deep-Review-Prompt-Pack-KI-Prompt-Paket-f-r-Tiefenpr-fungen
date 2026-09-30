@echo off
rem =========================================================================
rem  RepairCenter - Installation ohne Setup-Programm
rem  Kopiert die Anwendung nach %ProgramFiles%\RepairCenter, legt Verknuepfungen
rem  an und traegt sie in "Apps & Features" ein.
rem  MIT-Lizenz - Copyright (c) 2026 AOWD GENESIS
rem =========================================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0" 2>nul

set "PSEXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PSEXE%" set "PSEXE=powershell.exe"

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   Administratorrechte erforderlich - starte neu ^(UAC^) ...
    "%PSEXE%" -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b 0
)

set "SRC=%~dp0.."
set "DEST=%ProgramFiles%\RepairCenter"
set "VERSION=1.2.4"

echo.
echo   ====================================================
echo    RepairCenter %VERSION% - Installation
echo   ====================================================
echo    Ziel: %DEST%
echo.

if exist "%DEST%" (
    echo   Vorhandene Installation wird aktualisiert ...
)

for %%D in (src web installer docs) do (
    if exist "%SRC%\%%D" (
        robocopy "%SRC%\%%D" "%DEST%\%%D" /E /NFL /NDL /NJH /NJS /NP >nul
    )
)
for %%F in (RepairCenter.cmd README.md README.en.md LICENSE CHANGELOG.md SECURITY.md) do (
    if exist "%SRC%\%%F" copy /Y "%SRC%\%%F" "%DEST%\%%F" >nul
)

echo   Dateien kopiert.

rem --- Verknuepfungen ---------------------------------------------------
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -Command ^
  "$w = New-Object -ComObject WScript.Shell;" ^
  "$dir = Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\RepairCenter';" ^
  "New-Item -ItemType Directory -Path $dir -Force | Out-Null;" ^
  "$s = $w.CreateShortcut((Join-Path $dir 'RepairCenter.lnk'));" ^
  "$s.TargetPath = '%DEST%\RepairCenter.cmd';" ^
  "$s.WorkingDirectory = '%DEST%';" ^
  "$s.IconLocation = '%SystemRoot%\System32\shell32.dll,165';" ^
  "$s.Description = 'Windows reparieren, diagnostizieren, warten';" ^
  "$s.Save();" ^
  "$d = $w.CreateShortcut((Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'RepairCenter.lnk'));" ^
  "$d.TargetPath = '%DEST%\RepairCenter.cmd';" ^
  "$d.WorkingDirectory = '%DEST%';" ^
  "$d.IconLocation = '%SystemRoot%\System32\shell32.dll,165';" ^
  "$d.Save()"

echo   Verknuepfungen angelegt.

rem --- Eintrag in Apps ^& Features ---------------------------------------
set "KEY=HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\RepairCenter"
reg add "%KEY%" /v DisplayName     /t REG_SZ /d "RepairCenter" /f >nul
reg add "%KEY%" /v DisplayVersion  /t REG_SZ /d "%VERSION%" /f >nul
reg add "%KEY%" /v Publisher       /t REG_SZ /d "AOWD GENESIS" /f >nul
reg add "%KEY%" /v InstallLocation /t REG_SZ /d "%DEST%" /f >nul
reg add "%KEY%" /v DisplayIcon     /t REG_SZ /d "%SystemRoot%\System32\shell32.dll,165" /f >nul
reg add "%KEY%" /v UninstallString /t REG_SZ /d "\"%DEST%\installer\Uninstall.cmd\"" /f >nul
reg add "%KEY%" /v NoModify        /t REG_DWORD /d 1 /f >nul
reg add "%KEY%" /v NoRepair        /t REG_DWORD /d 1 /f >nul

echo   In "Apps ^& Features" eingetragen.

rem --- Optional: woechentliche Wartung ----------------------------------
echo.
set /p TASK="  Woechentliche Wartung im Taskplaner einrichten? (j/N) "
if /I "%TASK%"=="j" (
    schtasks /Create /TN "RepairCenter\Woechentliche Wartung" /SC WEEKLY /D SUN /ST 03:00 /RL HIGHEST /RU SYSTEM /F ^
      /TR "\"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe\" -NoProfile -ExecutionPolicy Bypass -File \"%DEST%\src\RepairCenter.Cli.ps1\" -Mode Quick -Optimize Safe -NoElevate" >nul
    if !ERRORLEVEL! EQU 0 (echo   Aufgabe angelegt: sonntags 03:00 Uhr.) else (echo   Aufgabe konnte nicht angelegt werden.)
)

echo.
echo   Fertig. Start ueber das Startmenue oder:  "%DEST%\RepairCenter.cmd"
echo.
pause
exit /b 0
