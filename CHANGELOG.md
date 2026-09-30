# Changelog

Alle nennenswerten Änderungen an diesem Projekt. Das Format orientiert sich an
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionierung an
[Semantic Versioning](https://semver.org/lang/de/).

## [1.2.4] – noch nicht veröffentlicht

Gefunden durch einen **Lasttest**: sechs Testläufe gleichzeitig. Was einzeln
nie auffiel, trat unter Last sofort zutage.

### Behoben
- **404-Fenster nach dem Start eines Reparaturlaufs.** Zwischen `POST /api/run`
  und dem ersten Lebenszeichen des Laufprozesses antwortete `GET /api/run/{id}`
  mit 404 – unter Last mehrere Sekunden lang. Der Dienst legt den Zustand jetzt
  sofort selbst an, so wie es bei Datenträgeraufträgen seit 1.2.1 schon war.
- **Kennungen von Reparaturläufen bestanden nur aus dem Zeitstempel.** Zwei
  Läufe in derselben Sekunde hätten sich dasselbe Verzeichnis geteilt und ihre
  Zustandsdateien gegenseitig überschrieben. Jetzt mit Zufallsanteil
  (`New-RunIdentifier`).
- **Zufallsraum der Auftragskennungen war zu klein.** Vier Zeichen aus 36
  ergeben 1.679.616 Möglichkeiten – nach dem Geburtstagsparadoxon rund 7 %
  Kollisionswahrscheinlichkeit bei 500 Ziehungen, und genau das ist im Test
  eingetreten. Jetzt acht Hexzeichen aus einer GUID: 5000 von 5000 Ziehungen
  im selben Sekundentakt eindeutig.

### Geändert
- Der Eindeutigkeitstest zieht jetzt **2000 Kennungen beider Arten** statt 500.
- Neuer Test: ein frisch gestarteter Lauf ist **ohne Wartezeit** abfragbar.

## [1.2.3] - 2026-09-30

### Behoben
- Testhuelle nannte am Ende nicht, welcher Test gescheitert war - sporadische Fehler liessen sich dadurch nicht zuordnen

## [1.2.2] – noch nicht veröffentlicht

### Behoben
- **Sporadisch scheiternde Tests.** Die neue Vorgangssperre aus 1.2.1 ließ
  Tests gelegentlich am `409` des Vorgängers scheitern. Die Tests warten jetzt
  über `Wait-DiskJobFree`, bis kein Vorgang mehr läuft. Zur Absicherung viermal
  hintereinander ausgeführt: 4 × 58/58.
- **Die Oberfläche zeigte nur eine Statusnummer.** Bei `409`, `400` oder `403`
  stand dort „HTTP 409" statt der Begründung des Dienstes. Jetzt wird der
  Klartext angezeigt, bei Eingabefehlern zusätzlich die Liste der beanstandeten
  Felder. Außerdem wird der Startknopf nach einem Fehlschlag wieder freigegeben.

### Neu
- `GET /api/disk/active` meldet, ob gerade ein Datenträgervorgang läuft – für
  die Oberfläche und für Tests.

## [1.2.1] – noch nicht veröffentlicht

Tiefenprüfung des gesamten Projekts. Gefunden wurden sechs echte Mängel –
alle behoben, alle mit Test abgesichert.

### Behoben
- **Anfragen fremder Webseiten konnten Vorgänge auslösen.** Ein lokaler Dienst
  ist aus jedem Browserfenster erreichbar; ohne Schutz hätte eine beliebige
  Seite im Hintergrund einen Löschauftrag starten können. Jetzt wird der
  Zusatzkopf `X-RepairCenter` verlangt, Vorabanfragen werden abgelehnt und
  fremde `Origin`-Angaben abgewiesen.
- **Eingaben wanderten ungeprüft in Prozessargumente.** Jetzt Positivlisten für
  jedes Feld; unbekannte Felder, unsinnige Zahlen und Pfade mit `..` werden mit
  400 abgelehnt.
- **Zwei Datenträgervorgänge konnten gleichzeitig laufen.** Jetzt gesperrt (409)
  – und zwar ab dem Startzeitpunkt, nicht erst wenn der Auftragsprozess seine
  Zustandsdatei angelegt hat.
- **Auftrags-IDs kollidierten im selben Sekundentakt** und hätten sich dieselbe
  Ablage geteilt. `New-DiskJobId` hängt jetzt vier Zufallszeichen an; gegen
  500 Erzeugungen in einer Schleife geprüft.
- **Die Installationsroutine trug noch Version 1.0.0** und hätte das falsch in
  „Apps & Features" eingetragen.
- **PSScriptAnalyzer war nie über die neuen Dateien gelaufen.** Die Prüfung
  meldete 85 Befunde; jetzt läuft sie über `src`, `tools` und `tests` ohne
  Befund. Die Behauptung in der Dokumentation war vorher schlicht falsch.

### Neu
- **`tools/Update-Version.ps1`**: setzt die Versionsnummer an allen 21 Stellen
  zugleich, legt den CHANGELOG-Eintrag an und prüft mit `-Check` auf
  Abweichungen. Dazu die Projektregel: **jede Fehlerbehebung erhöht die
  Versionsnummer** – abgesichert durch einen Test, der bei Abweichung scheitert,
  und durch einen eigenen CI-Schritt.
- **`PSScriptAnalyzerSettings.psd1`**: zwei Regeln begründet abgeschaltet, alle
  übrigen scharf gestellt.
- Anfragekörper auf 64 KB begrenzt.
- Tests auf **107** erweitert (57 PowerShell, 50 Oberfläche).

### Geändert
- Funktionen, die etwas verändern, unterstützen jetzt durchgängig
  `ShouldProcess`; reine Buchhaltungsfunktionen sind mit Begründung ausgenommen.
- Parameter `$WhatIf` in `New-RepairState` heißt jetzt `$WhatIfMode` – der alte
  Name kollidierte mit dem eingebauten Mechanismus.

## [1.2.0] – noch nicht veröffentlicht

Daten retten, bevor gelöscht wird. Und Wechselmedien beim Namen nennen.

### Neu
- **Datensicherung vor dem Löschen**: Kopieren oder Verschieben aller Volumes
  eines Datenträgers auf ein frei wählbares Ziel. Oberfläche und Auftrag
  verketten beides zu einem Vorgang mit zwei Abschnitten
  (`Daten sichern` → `Löschen`).
- **Scheitert die Sicherung, wird nichts gelöscht.** Der Auftrag bricht mit
  klarer Meldung ab.
- **Tempo beim Kopieren**: `robocopy` mit 32 Kopierfäden (`/MT:32`) und
  ungepufferter Ein-/Ausgabe (`/J`), ohne den bremsenden Wiederaufnahmemodus
  `/Z`. Fadenzahl und Puffermodus sind einstellbar.
- **Platz- und Zielprüfung**: Datenmenge und Dateizahl werden vorher ermittelt,
  der freie Platz am Ziel geprüft; ein Ziel auf dem zu löschenden Datenträger
  wird abgelehnt.
- **Erkennung von USB-Sticks und Speicherkarten** (SD/MMC, USB-Stick,
  USB-Festplatte, USB-SSD, NVMe, Festplatte) samt Kennzeichnung als
  Wechselmedium – aus `Get-Disk`, `Get-PhysicalDisk` und `Win32_DiskDrive`
  zusammengeführt.
- **Neue Endpunkte**: `/api/disk/targets`, `/api/disk/measure`, `/api/disk/rescue`;
  `/api/disk/wipe` nimmt jetzt die Sicherungsangaben entgegen.
- Tests auf **95** erweitert (48 PowerShell, 47 Oberfläche).

## [1.1.0] – noch nicht veröffentlicht

Datenträgerverwaltung: formatieren, Dateisystem wechseln, endgültig löschen.

### Neu
- **Modul `DiskManager.psm1`**: Bestandsaufnahme aller Datenträger samt Volumes,
  Anbindung, Medientyp, BitLocker-Status und Schutzkennzeichnung.
- **Schnelles Löschen** mit fünf Verfahren (`Auto`, `CryptoErase`, `Trim`,
  `Zero`, `ZeroVerify`). Der Nullschreiber arbeitet ungepuffert
  (`FILE_FLAG_NO_BUFFERING | FILE_FLAG_WRITE_THROUGH`), mit 32-MiB-Blöcken und
  vier gleichzeitig offenen Anforderungen – dadurch Gerätetempo statt
  Cache-Flut. BitLocker wird per Schlüsselvernichtung erledigt, SSDs per TRIM.
- **Eigener FAT32-Formatierer** nach Microsoft-Spezifikation: FAT32 auch
  oberhalb der 32-GB-Grenze von Windows, geprüft bis 2 TiB (512-Byte-Sektoren)
  und 14 TiB (4-KiB-Sektoren). Nach einem Nulllauf entfällt das erneute Nullen
  der FAT – die Formatierung ist dann sofort fertig.
- **Dateisystemwechsel**: FAT32 → NTFS verlustfrei über `convert.exe`; jeder
  verlustbehaftete Wechsel wird vorher benannt und braucht eine gesonderte
  Zustimmung.
- **Reiter „Datenträger"** in der Oberfläche mit Schutzkennzeichnung,
  Dauerschätzung, Bestätigungsschlüssel, Live-Durchsatz und Restzeit.
- **Neue Endpunkte**: `/api/disks`, `/api/disk/estimate`, `/api/disk/format`,
  `/api/disk/convert`, `/api/disk/wipe`, `/api/disk/job/{id}` samt Abbruch.
- **Dreifaches Sicherheitsnetz**: Systemdatenträger und schreibgeschützte
  Medien werden in Oberfläche, API und Engine abgelehnt.

### Geändert
- Tests auf **78** erweitert (38 PowerShell, 40 Oberfläche).
- `fmtBytes` in der Oberfläche zeigt Kilobyte jetzt mit einer Nachkommastelle.
- `scrollIntoView` wird abgesichert aufgerufen (fehlt in manchen Umgebungen).

## [1.0.0] – noch nicht veröffentlicht

Erste Fassung. Aus dem Einzelskript `Repair.ps1` 3.0.1 wurde eine vollständige
Anwendung mit Oberfläche, Backend und Installationsroutine.

### Neu
- **Engine als Modul** (`RepairEngine.psm1`): Preflight, Reparatur, Eskalation,
  Verifikation, gestufte Wartung und Berichtserstellung – von Oberfläche,
  Kommandozeile und Tests gemeinsam genutzt.
- **Backend** (`RepairCenter.Server.ps1`): lokaler Webdienst auf Basis von
  `HttpListener` mit REST-API; bindet ausschließlich an `localhost`.
- **Oberfläche** (`web/`): Einzelseiten-Anwendung ohne jede Abhängigkeit,
  **Deutsch und Englisch** zur Laufzeit umschaltbar, helles und dunkles Design,
  Live-Fortschritt, Schritt-Tabelle, Protokoll, Befunde, Systemübersicht, Verlauf.
- **Runner** (`RepairCenter.Runner.ps1`): jeder Lauf als eigener Prozess, damit die
  Oberfläche nie blockiert; Abbruch über Steuerdatei und Prozessende.
- **Demomodus**: kompletter Durchlauf ohne jeden Eingriff ins System – für
  Vorführungen, Tests und CI.
- **Installationsroutine**: Inno-Setup-Skript (`RepairCenter.iss`) für ein
  klassisches Windows-Setup mit Assistent (DE/EN), Startmenü, Deinstallation und
  optionaler wöchentlicher Wartungsaufgabe; alternativ `Install.cmd` ohne Setup-Programm.
- **Testumgebung**: fünf Demo-Szenarien (`Healthy`, `Repaired`, `Escalation`, `Failed`,
  `Preflight`) simulieren jeden Verlauf, ohne das System anzufassen – auch in der
  Oberfläche auswählbar.
- **Wiederherstellungspunkt** vor den Wartungsstufen Standard und Aggressiv,
  abwählbar über `-NoRestorePoint` bzw. die Oberfläche.
- **Berichtsansicht, Planung und Neustart** direkt in der Oberfläche
  (`/api/config`, `/api/schedule`, `/api/restart`, `?format=cbs|transcript`).
- **Selbsttest** (`Test-RepairCenter.ps1`): 23 Tests über Engine, Szenarien, API,
  Sprachpakete und Pfadsicherheit – ohne Fremdmodule.
- **Oberflächentests** (`tests/ui/ui.test.mjs`): 29 Tests mit jsdom gegen eine Attrappe
  des Backends. Node.js wird ausschließlich zum Testen gebraucht.
- **Kompatibilitätsprüfung** (`Test-Compat51.ps1`): findet per AST- und Token-Analyse
  Konstrukte, die PowerShell 7 erlaubt, Windows PowerShell 5.1 aber ablehnt.

### Übernommen aus Repair.ps1 3.0.1
- Bewertung des SFC-Ergebnisses über **CBS.log** statt über unzuverlässige Exitcodes;
  die Logdatei wird auch gelesen, während Windows sie geöffnet hält.
- **Automatische Eskalation**: DISM + zweiter SFC-Lauf, wenn Dateien nicht reparierbar waren.
- `RestoreHealth` **nur bei Bedarf** statt bei jedem Lauf.
- Neustart wird nur dann verlangt, wenn es Gründe dafür gibt – inklusive Begründungsliste.
- Preflight: Rechte, Werkzeuge, Speicherplatz, laufende Wartung, ausstehender Neustart, Akkubetrieb.
- Sysnative-Behandlung für 32-Bit-PowerShell auf 64-Bit-Windows.
- Exitcodes 0/1/2/3 für Automatisierung, zusätzlich 4 (keine Rechte) und 5 (UAC abgebrochen).
- Automatische Rechteerhöhung der Kommandozeile inklusive Weitergabe aller Parameter.

### Behoben (gegenüber Repair.ps1 2.1 / 3.0)
- `Stop-Transcript` wurde auch dann aufgerufen, wenn `Start-Transcript` fehlgeschlagen war.
- Werkzeugausgabe landete wegen `Start-Process` nicht im Protokoll.
- `sfc`-Ausgabe war wegen UTF-16 unlesbar.
- `$ErrorActionPreference = 'Stop'` ließ jede stderr-Zeile eines nativen Werkzeugs
  den Schritt abbrechen (`NativeCommandError`).
- `break` innerhalb eines `finally`-Blocks – von PowerShell 7 akzeptiert, von
  Windows PowerShell 5.1 mit `ControlLeavingFinally` abgelehnt.
- Pauschale Neustart-Empfehlung am Ende jedes Laufs.
