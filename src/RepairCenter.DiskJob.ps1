#Requires -Version 5.1
<#
=========================================================================
 RepairCenter - Auftrag der Datentraegerverwaltung
 Version: 1.2.4
 Fuehrt genau einen Vorgang aus (Formatieren, Dateisystem wechseln oder
 Loeschen) und schreibt den Fortschritt nach
 <LogRoot>\diskjobs\<JobId>\state.json.
 Laeuft als eigener Prozess, damit die Oberflaeche waehrend eines
 stundenlangen Loeschvorgangs bedienbar bleibt.
 MIT-Lizenz - Copyright (c) 2026 AOWD GENESIS
=========================================================================
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory)][string]$JobId,
    [Parameter(Mandatory)][ValidateSet('Format', 'Convert', 'Wipe', 'Rescue')][string]$Action,
    [string]$LogRoot = 'C:\RepairLogs',

    [int]$DiskNumber = -1,
    [string]$DriveLetter = '',
    [ValidateSet('NTFS', 'exFAT', 'FAT32', 'ReFS')][string]$FileSystem = 'NTFS',
    [string]$Label = '',
    [switch]$Full,
    [int]$AllocationUnitSize = 0,
    [switch]$AllowDataLoss,

    [ValidateSet('Auto', 'CryptoErase', 'Trim', 'Zero', 'ZeroVerify')][string]$Strategy = 'Auto',
    [string]$Confirmation = '',
    [int]$BufferMiB = 32,
    [int]$QueueDepth = 4,

    # Datenrettung vor dem Loeschen
    [string]$RescueTarget = '',
    [ValidateSet('Copy', 'Move')][string]$RescueMode = 'Copy',
    [int]$RescueThreads = 32,
    [switch]$RescueUnbuffered,

    [switch]$Demo
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module (Join-Path (Join-Path $ScriptDir 'modules') 'DiskManager.psm1') -Force -DisableNameChecking

if ($env:OS -ne 'Windows_NT' -and $LogRoot -eq 'C:\RepairLogs') {
    $LogRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'RepairLogs'
}
$jobDir = Join-Path (Join-Path $LogRoot 'diskjobs') $JobId
if (-not (Test-Path -LiteralPath $jobDir)) { New-Item -ItemType Directory -Path $jobDir -Force | Out-Null }
$statePath = Join-Path $jobDir 'state.json'

$state = [ordered]@{
    jobId       = $JobId
    action      = $Action
    diskNumber  = $DiskNumber
    driveLetter = $DriveLetter
    fileSystem  = $FileSystem
    strategy    = $Strategy
    demo        = [bool]$Demo
    stage       = ''
    stages      = @()
    rescue      = $null
    status      = 'running'
    ok          = $false
    percent     = 0
    bytesDone   = 0
    bytesTotal  = 0
    throughput  = 0
    secondsLeft = $null
    startTime   = (Get-Date).ToString('o')
    endTime     = $null
    durationSec = 0
    detail      = ''
    log         = @()
}

$script:LastFlush = [datetime]::MinValue

function Save-JobState {
    param([switch]$Force)
    $now = Get-Date
    if (-not $Force -and ($now - $script:LastFlush).TotalMilliseconds -lt 400) { return }
    $script:LastFlush = $now
    try {
        $tmp = $statePath + '.tmp'
        ([pscustomobject]$state) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $tmp -Encoding UTF8 -Force
        Move-Item -LiteralPath $tmp -Destination $statePath -Force
    }
    catch { Write-Verbose 'Zustand nicht speicherbar.' }
}

function Write-JobLog {
    param([string]$Text, [string]$Kind = 'info')
    $entry = [ordered]@{ t = (Get-Date).ToString('HH:mm:ss'); kind = $Kind; text = $Text }
    $list = @($state.log) + , $entry
    if ($list.Count -gt 500) { $list = $list[($list.Count - 500)..($list.Count - 1)] }
    $state.log = $list
    Write-Host ('  ' + $Text)
    Save-JobState
}

Save-JobState -Force
Write-JobLog -Kind section -Text ('Auftrag {0} gestartet ({1})' -f $Action, $(if ($Demo) { 'Demo' } else { 'produktiv' }))

function Set-JobStage {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'Vermerkt nur den Abschnitt in der Zustandsdatei.')]
    param([string]$Name, [string]$Status, [string]$Detail = '')
    $state.stage = $Name
    $list = @($state.stages)
    $found = $false
    for ($i = 0; $i -lt $list.Count; $i++) {
        if ($list[$i].name -eq $Name) { $list[$i].status = $Status; $list[$i].detail = $Detail; $found = $true }
    }
    if (-not $found) { $list += , ([ordered]@{ name = $Name; status = $Status; detail = $Detail }) }
    $state.stages = $list
    Save-JobState -Force
}

# Fortschrittsmeldung, die zwischen Sicherung und Loeschen unterscheidet
$progressHandler = {
    param($p)
    $state.percent = $p.percent
    $state.bytesDone = $p.bytesDone
    $state.bytesTotal = $p.bytesTotal
    $state.throughput = $p.throughput
    $state.secondsLeft = $p.secondsLeft
    if ($p.stage) { $state.stage = [string]$p.stage }
    Save-JobState
}

$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    # ---- Schritt 1: Daten sichern, falls gewuenscht -------------------
    if ($RescueTarget -and ($Action -eq 'Wipe' -or $Action -eq 'Rescue')) {
        Set-JobStage -Name 'rescue' -Status 'running'
        Write-JobLog ('Sichere Daten nach "{0}" ({1}, {2} Faeden{3})' -f $RescueTarget,
            $(if ($RescueMode -eq 'Move') { 'verschieben' } else { 'kopieren' }), $RescueThreads,
            $(if ($RescueUnbuffered) { ', ungepuffert' } else { '' }))

        $rescue = Invoke-DataRescue -DiskNumber $DiskNumber -TargetPath $RescueTarget -Mode $RescueMode `
            -Threads $RescueThreads -Unbuffered:$RescueUnbuffered -OnProgress $progressHandler -Demo:$Demo -Confirm:$false

        $state.rescue = $rescue
        if (-not $rescue.ok) {
            Set-JobStage -Name 'rescue' -Status 'FAILED' -Detail ([string]$rescue.detail)
            $state.ok = $false
            $state.detail = ('Datensicherung fehlgeschlagen - es wurde NICHTS geloescht. {0}' -f $rescue.detail)
            Write-JobLog -Kind error -Text $state.detail
            throw $state.detail
        }
        Set-JobStage -Name 'rescue' -Status 'PASS' -Detail ([string]$rescue.detail)
        Write-JobLog -Kind ok -Text ('Datensicherung abgeschlossen: {0}' -f $rescue.detail)
        $state.percent = 0
        Save-JobState -Force
    }

    if ($Action -eq 'Rescue') {
        $state.ok = $true
        if ($state.rescue) { $state.detail = [string]$state.rescue.detail }
        else { $state.detail = 'Kein Ziel angegeben - nichts zu tun.'; $state.ok = $false }
    }
    elseif ($Action -eq 'Format') {
        Write-JobLog ('Formatiere {0}: mit {1}{2}' -f $DriveLetter, $FileSystem, $(if ($Full) { ' (vollstaendig)' } else { ' (schnell)' }))
        $r = Format-ManagedVolume -DriveLetter $DriveLetter -FileSystem $FileSystem -Label $Label `
            -Full:$Full -AllocationUnitSize $AllocationUnitSize -Demo:$Demo -Confirm:$false
        $state.ok = [bool]$r.ok
        $state.detail = [string]$r.detail
    }
    elseif ($Action -eq 'Convert') {
        Write-JobLog ('Wechsle Dateisystem von {0}: nach {1}' -f $DriveLetter, $FileSystem)
        $r = Convert-VolumeFileSystem -DriveLetter $DriveLetter -TargetFileSystem $FileSystem -Label $Label `
            -AllowDataLoss:$AllowDataLoss -Demo:$Demo -Confirm:$false
        $state.ok = [bool]$r.ok
        $state.detail = [string]$r.detail
        if ($r.lossless) { Write-JobLog -Kind ok -Text 'Verlustfreier Weg verwendet (convert.exe).' }
    }
    else {
        Set-JobStage -Name 'wipe' -Status 'running'
        $disks = @(Get-DiskInventory -Demo:$Demo)
        $disk = $disks | Where-Object { $_.number -eq $DiskNumber } | Select-Object -First 1
        if ($disk) {
            $state.bytesTotal = [long]$disk.sizeBytes
            $eff = Get-WipeStrategy -Disk $disk -Requested $Strategy
            $est = Get-WipeEstimate -SizeBytes $disk.sizeBytes -Strategy $eff -BusType $disk.busType -MediaType $disk.mediaType
            $state.strategy = $eff
            Write-JobLog ('Datentraeger {0}: {1} ({2} GB, {3}/{4})' -f $disk.number, $disk.friendlyName,
                [math]::Round($disk.sizeBytes / 1GB, 1), $disk.busType, $disk.mediaType)
            Write-JobLog ('Verfahren {0} - geschaetzte Dauer {1}. {2}' -f $eff, (Format-Duration $est.seconds), $est.note)
            Save-JobState -Force
        }

        $state.stage = 'wipe'
        $r = Clear-DiskContent -DiskNumber $DiskNumber -Strategy $Strategy -Confirmation $Confirmation `
            -BufferMiB $BufferMiB -QueueDepth $QueueDepth -OnProgress $progressHandler -Demo:$Demo -Confirm:$false
        $state.ok = [bool]$r.ok
        $state.detail = [string]$r.detail
        if ($r.strategy) { $state.strategy = [string]$r.strategy }
        if ($r.throughput) { $state.throughput = $r.throughput }
        Set-JobStage -Name 'wipe' -Status $(if ($r.ok) { 'PASS' } else { 'FAILED' }) -Detail ([string]$r.detail)
    }
}
catch {
    $state.ok = $false
    $state.detail = $_.Exception.Message
    Write-JobLog -Kind error -Text ('Fehlgeschlagen: {0}' -f $_.Exception.Message)
}
finally { $sw.Stop() }

$state.status = 'done'
$state.percent = 100
$state.endTime = (Get-Date).ToString('o')
$state.durationSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)
Write-JobLog -Kind $(if ($state.ok) { 'ok' } else { 'error' }) -Text $state.detail
Save-JobState -Force

if ($state.ok) { exit 0 }
exit 3
