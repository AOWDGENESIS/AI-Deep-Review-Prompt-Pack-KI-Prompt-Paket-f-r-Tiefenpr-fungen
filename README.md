<div align="center">

# RepairCenter

**Windows reparieren, diagnostizieren, warten und Datenträger verwalten – mit Oberfläche, nachvollziehbar und komplett offline.**

Sprachen / Languages:
**Deutsch** | [English](README.en.md)

![Version](https://img.shields.io/badge/Version-1.2.4-1473e6)
![Plattform](https://img.shields.io/badge/Plattform-Windows%2010%2F11-0078d4)
![PowerShell](https://img.shields.io/badge/Windows%20PowerShell-5.1%2B-5391fe)
![Offline](https://img.shields.io/badge/100%25-offline-2e7d32)
![Tests](https://img.shields.io/badge/Tests-109%2F109-2e7d32)
![Lizenz](https://img.shields.io/badge/Lizenz-MIT-yellow)

</div>

---

## Was ist RepairCenter?

RepairCenter bündelt die Windows-Bordmittel **DISM**, **SFC** und **chkdsk** zu einem
nachvollziehbaren Ablauf und stellt sie in einer zweisprachigen Oberfläche bereit:

> erst feststellen, was nötig ist → nur das Nötige ausführen → das Ergebnis verifizieren → sauber dokumentieren

Danach räumt eine **gestufte Wartung** auf – von „verlustfrei" bis „aggressiv", jede Stufe
vorher simulierbar. Es gibt **keine Registry-Cleaner, keine Tuning-Tweaks, keine Cloud**:
keine Fremdmodule, keine Internetverbindung, keine Telemetrie.

## Funktionen

### Vier Modi
| Modus | Was passiert | Typische Dauer |
|---|---|---|
| **Schnell** | SFC + kurze Integritätsprüfung | wenige Minuten |
| **Diagnose** | strikt lesend: CheckHealth, ScanHealth, `sfc /verifyonly`, `chkdsk /scan`, SMART | 5–20 Minuten |
| **Reparatur** *(Standard)* | RestoreHealth **nur wenn nötig**, SFC, CBS-Auswertung, Verifikation | 10–40 Minuten |
| **Vollständig** | zusätzlich Tiefenprüfung und erzwungene Reparatur | 20–60 Minuten |

### Automatische Eskalation
Meldet SFC „Cannot repair member file", sind meist die Quelldateien im Komponentenstore
selbst defekt. RepairCenter erkennt das und fährt **von selbst** einen zweiten Anlauf:
`DISM /RestoreHealth` → `sfc /scannow` → erneute Auswertung. Geht es danach sauber durch,
wird der Gesamtstatus korrekt von FEHLER auf REPARIERT korrigiert.

### Vier Wartungsstufen
| Stufe | Inhalt | Umkehrbarkeit |
|---|---|---|
| `Keine` | nur reparieren | – |
| `Sicher` *(Standard)* | Temp-Dateien, DNS-Cache, WinSxS-Analyse, Fragmentierungsanalyse | verlustfrei |
| `Standard` | + WinSxS-Bereinigung (nur wenn DISM sie empfiehlt), Update-Cache, WER, Delivery Optimization, Thumbnails, **TRIM bei SSD / Defrag bei HDD** | Caches bauen sich neu auf |
| `Aggressiv` | + `/ResetBase`, Papierkorb, Windows-Update-Komponenten-Reset, Winsock-/IP-Reset | Neustart nötig, Warnung in der Oberfläche |

Vor Stufe *Standard* und *Aggressiv* wird automatisch ein **Wiederherstellungspunkt** angelegt.

### Oberfläche
- **Deutsch** als Vorgabe, Englisch per Klick – Umschaltung im laufenden Betrieb
- **Dunkles Design** als Vorgabe, helles Design per Klick; Auswahl wird gespeichert
- Sechs Bereiche: **Reparatur · System · Verlauf · Bericht · Planung · Info**
- Live-Fortschritt, Schritt-Tabelle, farbiges Protokoll (Werkzeugausgabe ausblendbar), Befundliste
- **Alle Engine-Parameter bedienbar**: Modus, Wartungsstufe, Simulation, Überspringen von
  DISM/SFC/Datenträger, Eskalation abschalten, Wiederherstellungspunkt abwählen,
  Dateialter und Mindestspeicher unter „Erweitert"
- **Berichtsansicht** direkt in der Anwendung: Bericht, Werkzeug-Log, CBS-Auszug, JSON – mit Kopierfunktion
- **Neustart-Banner** mit Begründung und Schaltfläche „Jetzt neu starten" (60 s Vorlauf, `shutdown /a` bricht ab)
- **Planung**: wöchentliche Wartungsaufgabe im Taskplaner anlegen und entfernen
- **Demomodus** mit fünf Testszenarien – die komplette Oberfläche ausprobieren, ohne dass etwas am System passiert


## Datenträgerverwaltung (ab 1.1.0)

Formatieren, Dateisystem wechseln und Datenträger endgültig löschen – im
Reiter **Datenträger**. Der Systemdatenträger wird grundsätzlich verweigert,
jeder Vorgang verlangt das Eintippen eines Bestätigungsschlüssels
(`DISK1`, `E:` …).

### Erst retten, dann löschen

Vor dem Nullen lassen sich die Daten in einem Zug sichern – die Oberfläche
verkettet beides zu einem Auftrag: **Daten sichern → Löschen**. Scheitert die
Sicherung, wird **nichts** gelöscht.

- **Kopieren** (Quelle bleibt bis zum Löschen unangetastet) oder **Verschieben**
  (Quelle wird erst nach erfolgreicher Kopie geleert).
- Datenmenge und Dateizahl werden vorher ermittelt, der freie Platz am Ziel
  geprüft. Passt es nicht, bleibt der Startknopf gesperrt.
- Das Ziel darf niemals auf dem Datenträger liegen, der gelöscht werden soll –
  das wird abgefangen.

**Warum das Kopieren schnell ist:** es läuft über `robocopy` mit
**32 Kopierfäden** (`/MT:32`) und **ungepufferter Ein-/Ausgabe** (`/J`). Das
erste hilft bei vielen kleinen Dateien, das zweite bei großen. Bewusst *nicht*
gesetzt ist `/Z` – der Wiederaufnahmemodus ist berüchtigt dafür, Kopien um ein
Vielfaches zu verlangsamen, und wird von vielen Anleitungen trotzdem empfohlen.
Fäden und Puffermodus sind in der Oberfläche einstellbar.

### Löschen: warum das hier schneller ist

Die meisten Werkzeuge schreiben gepuffert in 4-KiB- bis 1-MiB-Häppchen und
fahren aus Gewohnheit drei Durchgänge. Das ist der Grund für die
Wartezeiten, nicht die Festplatte.

| Situation | Übliche Werkzeuge | RepairCenter |
|---|---|---|
| BitLocker-Datenträger | stundenlanges Überschreiben | **Schlüssel vernichten – Sekunden** |
| SSD / NVMe | Überschreiben (langsam *und* schädlich für die Zellen) | **TRIM / UNMAP – Sekunden** |
| HDD 8 TB | 3 Durchgänge, gepuffert: 20–40 Stunden | **1 Durchgang, ungepuffert – rund 12 Stunden, also Gerätetempo** |
| Formatieren direkt nach dem Löschen | FAT erneut nullen | **erkennt „bereits leer" – sofort fertig** |

Die vier Hebel im Detail:

1. **Ungepuffert** (`FILE_FLAG_NO_BUFFERING | FILE_FLAG_WRITE_THROUGH`): der
   Dateisystemcache wird nicht geflutet, die Daten gehen direkt zum Laufwerk.
2. **Große Blöcke** – Standard 32 MiB statt 4 KiB. Ein Block pro Anforderung
   statt achttausend.
3. **Mehrere offene Anforderungen** (Warteschlangentiefe 4, einstellbar bis 8):
   das Laufwerk arbeitet weiter, während die nächste Anforderung schon unterwegs ist.
   Bei NVMe bringt das ein Vielfaches.
4. **Ein Durchgang mit Nullen statt drei Runden Zufall.** Bei Laufwerken mit
   Magnetaufzeichnung ab etwa 2001 ist nach einem Überschreiben nichts mehr
   rekonstruierbar – mehr Durchgänge kosten nur Zeit.

Blockgröße und Warteschlangentiefe lassen sich in der Oberfläche einstellen,
die Restzeit wird live aus dem gemessenen Durchsatz berechnet.

### Fünf Verfahren

| Verfahren | Wann sinnvoll | Dauer bei 8 TB |
|---|---|---|
| `Automatisch` | Standard – wählt selbst das schnellste zulässige | – |
| `BitLocker-Schlüssel vernichten` | verschlüsselte Datenträger | Sekunden |
| `TRIM / UNMAP` | SSD, NVMe | Sekunden |
| `Mit Nullen überschreiben` | Festplatten, Weitergabe, Verkauf | ~12 h |
| `Überschreiben und prüfen` | wenn ein Nachweis gebraucht wird | ~24 h |

### Formatieren und Dateisystem wechseln

- **NTFS, exFAT, FAT32, ReFS** – schnell oder vollständig, Bezeichnung und
  Clustergröße frei wählbar.
- **FAT32 jenseits der 32-GB-Grenze:** Windows' eigenes `format` verweigert
  FAT32 oberhalb von 32 GB. RepairCenter bringt einen **eigenen FAT32-Formatierer**
  nach Microsoft-Spezifikation mit – geprüft bis **2 TiB** mit 512-Byte-Sektoren
  und **14 TiB** mit 4-KiB-Sektoren. Die Grenzen werden mit Begründung gemeldet,
  statt kommentarlos zu scheitern.
- **FAT32 → NTFS läuft verlustfrei** über `convert.exe`. Jeder andere Wechsel
  (etwa NTFS → FAT32) ist technisch nur durch Neuformatieren möglich – die
  Oberfläche sagt das vorher deutlich und verlangt eine gesonderte Zustimmung.

### USB-Sticks und Speicherkarten

Wechselmedien werden erkannt und benannt, statt als „unbekanntes Laufwerk"
aufzutauchen:

| Anbindung / Medientyp | Erkannt als |
|---|---|
| SD, MMC | **Speicherkarte** |
| USB, klein (≤ 512 GB) | **USB-Stick** |
| USB + HDD | USB-Festplatte |
| USB + SSD | USB-SSD |
| NVMe | NVMe-SSD |
| SATA + HDD | Festplatte |

Jede Karte trägt ihre Art als Kennzeichen, Wechselmedien zusätzlich den
Hinweis „Wechselmedium". Die Erkennung nutzt `Get-Disk`, `Get-PhysicalDisk`
und `Win32_DiskDrive` gemeinsam, weil keine der Quellen allein zuverlässig ist.

### Schutz des Dienstes

Der Webdienst lauscht nur auf `localhost`. Weil ein lokaler Dienst trotzdem aus
jedem Browserfenster erreichbar ist, verlangt jede schreibende Anfrage den
Zusatzkopf `X-RepairCenter`, Vorabanfragen werden nicht beantwortet und fremde
`Origin`-Angaben abgewiesen. Alle Felder laufen gegen Positivlisten, bevor
daraus Prozessargumente werden, und es läuft immer nur ein Datenträgervorgang
gleichzeitig. Details in [SECURITY.md](SECURITY.md).

### Sicherheitsnetz

- Scheitert die vorgeschaltete Datensicherung, wird der Löschvorgang **nicht** gestartet.
- Systemdatenträger und schreibgeschützte Medien werden **immer** abgelehnt –
  in der Oberfläche, in der API und in der Engine selbst (dreifach geprüft).
- Bestätigungsschlüssel muss exakt eingetippt werden, sonst bleibt die
  Schaltfläche gesperrt.
- Jeder Vorgang läuft als eigener Prozess mit Live-Fortschritt und lässt sich abbrechen.
- Im Demomodus ist alles gefahrlos durchspielbar.

## Installation

**Variante A – Setup-Programm** (klassischer Assistent, Startmenü, Deinstallation):

1. `RepairCenter-Setup-1.0.0.exe` von der [Release-Seite](../../releases) herunterladen
2. Doppelklicken, Assistent durchlaufen (Deutsch oder Englisch)
3. Start über das Startmenü → **RepairCenter**

**Variante B – ohne Setup-Programm:**

1. Repository herunterladen und entpacken
2. `installer\Install.cmd` als Administrator ausführen

**Variante C – portabel:** `RepairCenter.cmd` doppelklicken. Nichts wird installiert.

Alle Varianten benötigen **nur Windows 10/11 mit Windows PowerShell 5.1** – das ist bereits an Bord.
Keine Runtime, keine Bibliotheken, kein Internet.

## Bedienung

Nach dem Start öffnet sich die Oberfläche unter `http://localhost:8720/`.
Der Dienst bindet ausschließlich an **localhost** und ist von außen nicht erreichbar.

### Kommandozeile

Dieselbe Engine, ohne Oberfläche – für Taskplaner und Fernwartung:

```powershell
.\src\RepairCenter.Cli.ps1                              # Reparatur + sichere Wartung
.\src\RepairCenter.Cli.ps1 -Mode Diagnose               # nur prüfen
.\src\RepairCenter.Cli.ps1 -Mode Full -Optimize Standard
.\src\RepairCenter.Cli.ps1 -Optimize Aggressive -WhatIf # erst simulieren
```

Das Skript fordert bei Bedarf selbst Administratorrechte an (UAC).

| Exitcode | Bedeutung |
|---|---|
| 0 | HEALTHY – System ist integer |
| 1 | REPAIRED – Neustart empfohlen |
| 2 | WARNING – Hinweise prüfen |
| 3 | FAILED – Reparatur mit Installationsquelle nötig |
| 4 | keine Administratorrechte |
| 5 | UAC abgebrochen |

## Berichte

Jeder Lauf legt unter `C:\RepairLogs\runs\<Zeitstempel>\` ab:

| Datei | Inhalt |
|---|---|
| `report.txt` | lesbarer Ergebnisbericht |
| `state.json` | vollständige Daten, maschinenlesbar |
| `tools.log` | Rohausgabe von DISM, SFC, chkdsk |
| `transcript.log` | komplettes Sitzungsprotokoll |
| `CBS-SFC.txt` | die relevanten `[SR]`-Zeilen dieses Laufs |

## Architektur

| Baustein | Aufgabe |
|---|---|
| `src/modules/RepairEngine.psm1` | Kern: Preflight, Reparatur, Eskalation, Verifikation, Wartung, Bericht |
| `src/modules/DiskManager.psm1` | Datenträger: Bestandsaufnahme inkl. USB/Speicherkarten, Datensicherung, Formatieren, FAT32-Formatierer, Dateisystemwechsel, schnelles Löschen |
| `src/RepairCenter.DiskJob.ps1` | führt einen Datenträgervorgang als eigenen Prozess aus |
| `src/RepairCenter.Server.ps1` | Backend: REST-API und Auslieferung der Oberfläche (`HttpListener`) |
| `src/RepairCenter.Runner.ps1` | führt einen Lauf als eigenen Prozess aus, damit die Oberfläche nie blockiert |
| `src/RepairCenter.Cli.ps1` | Kommandozeile mit automatischer Rechteerhöhung |
| `web/` | Oberfläche: reines HTML/CSS/JavaScript, keine Abhängigkeiten |
| `web/i18n/` | Sprachpakete Deutsch und Englisch |
| `installer/` | Inno-Setup-Skript, `Install.cmd`, `Uninstall.cmd` |
| `tests/` | Selbsttest (59 Tests), Oberflächentests (50 Tests), 5.1-Kompatibilitätsprüfung |
| `tools/Update-Version.ps1` | setzt und prüft die Versionsnummer projektweit |

Backend und Oberfläche reden über eine schmale REST-API:

| Endpunkt | Zweck |
|---|---|
| `GET /api/system` | Systemübersicht |
| `POST /api/run` | Lauf starten |
| `GET /api/run/{id}` | Fortschritt, Schritte, Protokoll |
| `POST /api/run/{id}/cancel` | Lauf abbrechen |
| `GET /api/runs` | Verlauf |
| `GET /api/report/{id}` | Bericht (`?format=json` / `tools` / `cbs` / `transcript`) |
| `GET /api/config` | Version, Ablageort, Betriebsart |
| `GET POST DELETE /api/schedule` | wöchentliche Wartungsaufgabe |
| `POST /api/restart` | Neustart mit 60 Sekunden Vorlauf |
| `GET /api/disks` | Datenträger, Volumes, Schutzstatus |
| `GET /api/disk/estimate` | Verfahren und geschätzte Dauer |
| `GET /api/disk/active` | läuft gerade ein Datenträgervorgang? |
| `GET /api/disk/targets` | mögliche Ziele für die Datensicherung |
| `GET /api/disk/measure` | Datenmenge und Dateizahl eines Datenträgers |
| `POST /api/disk/format` · `/convert` · `/wipe` | Vorgang starten |
| `GET /api/disk/job/{id}` | Fortschritt, Durchsatz, Restzeit |

## Testumgebung

Im Demomodus täuscht die Engine einen Systemzustand vor, statt DISM und SFC
wirklich aufzurufen. Über **fünf Szenarien** lässt sich jeder Verlauf durchspielen,
ohne ein kaputtes Windows zu brauchen:

| Szenario | Was simuliert wird | Erwartetes Ergebnis |
|---|---|---|
| `Healthy` | keine Befunde | HEALTHY |
| `Repaired` | SFC repariert zwei Dateien | REPAIRED + Neustartgrund |
| `Escalation` | SFC scheitert, DISM hilft, zweiter Lauf ist sauber | REPAIRED, Erstbefund auf WARNUNG herabgestuft |
| `Failed` | SFC scheitert, DISM scheitert ebenfalls | FAILED + Hinweis auf fehlende Installationsquelle |
| `Preflight` | Preflight blockiert | FAILED, **kein** Eingriff ins System |

## Tests

```powershell
.\tests\Test-RepairCenter.ps1     # 59 Tests: Engine, Szenarien, Datenträger, API, Kompatibilität
.\tests\Test-Compat51.ps1         # nur die 5.1-Kompatibilitätsprüfung
```

```bash
npm install && npm test            # 50 Oberflächentests (jsdom, ohne Browser)
```

Zusammen **109 Tests**. Der PowerShell-Selbsttest läuft vollständig im Demomodus – er
fasst das System nicht an und funktioniert auch unter PowerShell 7 (Linux/CI).
Die Oberflächentests prüfen gegen eine Attrappe des Backends: Standardsprache,
Standarddesign, Vollständigkeit aller Bedienelemente, Sprachumschaltung, Formular →
Anfrage, Darstellung von Schritten/Befunden/Protokoll, Neustart-Banner, Berichtsansicht,
Planung und Schutz gegen HTML-Einschleusung. **Node.js wird nur zum Testen gebraucht –
die Anwendung selbst läuft ohne.**

Die Kompatibilitätsprüfung findet per AST- und Token-Analyse Konstrukte, die
PowerShell 7 akzeptiert, Windows PowerShell 5.1 aber ablehnt – etwa `break` in
einem `finally`-Block (`ControlLeavingFinally`), `??`, `&&`/`||` oder `-Parallel`.

## Was RepairCenter bewusst nicht tut

- keine Registry-„Cleaner", keine „RAM-Optimierer", keine Tuning-Tweaks
- keine Dienste abschalten, keine Autostart-Einträge eigenmächtig deaktivieren – sie werden nur berichtet
- kein Löschen von `Windows.old` oder Benutzerdaten
- kein Anfassen des Systemdatenträgers in der Datenträgerverwaltung
- keine Cloud, keine Telemetrie, keine Netzverbindung

## Dokumentation

- [CHANGELOG](CHANGELOG.md) – alle Versionen
- [Architektur](docs/ARCHITEKTUR.md) – Aufbau und Datenfluss
- [Sicherheit](SECURITY.md) – Rechte, Bindung, Datenhaltung
- [Mitwirken](CONTRIBUTING.md)

## Lizenz

[MIT](LICENSE) – Copyright © 2026 AOWD GENESIS.

---

<div align="center">

**RepairCenter – repariert, was kaputt ist. Und lässt den Rest in Ruhe.**

</div>
