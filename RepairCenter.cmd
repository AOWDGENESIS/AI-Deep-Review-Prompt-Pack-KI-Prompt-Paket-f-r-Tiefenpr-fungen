@echo off
rem =========================================================================
rem  RepairCenter - Start (portabel)
rem  Version: 1.2.4
rem  Startet den lokalen Dienst und oeffnet die Oberflaeche im Browser.
rem  Umgeht die Ausfuehrungsrichtlinie und fordert Administratorrechte an.
rem  MIT-Lizenz - Copyright (c) 2026 AOWD GENESIS
rem =========================================================================
setlocal
cd /d "%~dp0" 2>nul

set "PSEXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PSEXE%" set "PSEXE=powershell.exe"
set "SERVER=%~dp0src\RepairCenter.Server.ps1"

if not exist "%SERVER%" (
    echo.
    echo   FEHLER: %SERVER% nicht gefunden.
    echo.
    pause
    exit /b 2
)

rem --- Administratorrechte pruefen -------------------------------------
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   Administratorrechte erforderlich - starte neu ^(UAC^) ...
    "%PSEXE%" -NoProfile -ExecutionPolicy Bypass -Command ^
        "Start-Process -FilePath '%~f0' -Verb RunAs -ArgumentList '%*'"
    exit /b 0
)

rem --- Internet-Markierung entfernen -----------------------------------
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -Command ^
    "Get-ChildItem -Path '%~dp0' -Recurse -Include *.ps1,*.psm1 | Unblock-File -ErrorAction SilentlyContinue"

rem --- Dienst starten ---------------------------------------------------
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File "%SERVER%" %*
exit /b %ERRORLEVEL%
