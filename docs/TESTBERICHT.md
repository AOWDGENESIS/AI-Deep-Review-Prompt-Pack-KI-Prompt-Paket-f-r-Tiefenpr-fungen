# Testbericht

Stand: 30.09.2026 · RepairCenter 1.2.4

Dieser Bericht hält fest, **was tatsächlich geprüft wurde** – und ebenso offen,
was noch aussteht.

## Zusammenfassung

| Suite | Tests | Ergebnis |
|---|---|---|
| PowerShell-Selbsttest (`tests/Test-RepairCenter.ps1`) | 59 | **59 bestanden** |
| Oberflächentests (`tests/ui/ui.test.mjs`, jsdom) | 50 | **50 bestanden** |
| Kompatibilität Windows PowerShell 5.1 (`tests/Test-Compat51.ps1`) | 10 Dateien | **ohne Befund** |
| PowerShell-Parser | 10 Dateien | **ohne Befund** |
| PSScriptAnalyzer (`src`, `tools`, `tests`) | 10 Dateien | **ohne Befund** |
| Versionsnummer projektweit einheitlich | 21 Stellen | **1.2.1** |
| **Gesamt** | **109** | **109 bestanden, 0 fehlgeschlagen** |

> Der Selbsttest wurde nach den Änderungen **sechsmal hintereinander**
> ausgeführt: 6 × 58/58.
>
> **Der sporadische Fehlschlag ist gefunden und behoben.** Nachdem die
> Testhülle die Namen gescheiterter Tests am Ende wiederholt, wurden
> **sechs Testläufe gleichzeitig** gestartet. Unter dieser Last trat er
> sofort auf – und entpuppte sich als **zwei echte Produktfehler**:
> das 404-Fenster nach dem Start eines Laufs und der zu kleine Zufallsraum
> der Kennungen (siehe CHANGELOG 1.2.4). Beide sind behoben; danach:
> Einzellauf 59/59, zwei gleichzeitige Läufe je 59/59.
>
> Hinweis zum Lasttest selbst: bei sechs gleichzeitigen Läufen wurden drei
> Prozesse vom Sandbox-Speicher beendet. Das ist eine Grenze der Prüfumgebung,
> kein Befund am Programm.

> **Korrektur zur Vorversion:** Im Bericht zu 1.1.0 und 1.2.0 stand
> „PSScriptAnalyzer: ohne Befund". Das war falsch – die Prüfung war nie über
> die neuen Projektdateien gelaufen, nur über das alte Einzelskript. Der erste
> echte Lauf meldete **85 Befunde**. Sie sind jetzt abgearbeitet, und die
> Prüfung läuft in der CI über `src`, `tools` und `tests`.

Laufzeitumgebung der Prüfung: Debian 13, PowerShell 7.4.6, Node.js 20.20.
Die Engine lief dabei im Demomodus.

## PowerShell-Selbsttest (23)

### Engine
1. Modul exportiert die erwarteten Funktionen
2. `Format-ByteSize` rechnet korrekt (MB, GB)
3. Systemübersicht liefert alle Pflichtfelder
4. **CBS-Parser** ignoriert Einträge vor Laufbeginn und liest die Datei,
   **während ein anderer Prozess sie geöffnet hält** (`FileShare::ReadWrite`)
5. Vollständiger Demolauf erzeugt `state.json` und `report.txt`
6. Diagnosemodus erzwingt Wartungsstufe `None` (strikt lesend)

### Testumgebung: Demo-Szenarien
7. `Healthy` → Gesamtstatus HEALTHY
8. `Repaired` → REPAIRED, Neustart wird verlangt
9. `Escalation` → REPAIRED
10. `Failed` → FAILED
11. `Escalation` im Detail: `DISM_RestoreHealth_2` und `SFC_2` laufen, der
    Erstbefund `CBS_Analyse` wird auf WARNING mit dem Hinweis „(im 2. Durchlauf
    behoben)" herabgestuft
12. `Failed` im Detail: nach gescheitertem DISM folgt **kein** zweiter SFC,
    stattdessen der Hinweis auf die fehlende Installationsquelle
13. `Preflight` blockiert: genau ein Schritt, keinerlei Eingriff
14. Wiederherstellungspunkt: bei Stufe `Standard` angelegt, mit `-NoRestorePoint`
    übersprungen, bei Stufe `Safe` gar nicht erst vorgesehen

### Backend (REST-API)
15. `GET /api/health`
16. `GET /api/system`
17. `GET /api/config` (Version, Ablageort, Betriebsart)
18. `GET /api/schedule` (unter Linux als „nicht unterstützt" gemeldet)
19. Oberfläche und beide Sprachpakete werden ausgeliefert (HTTP 200)
20. Sprachpakete haben identische Schlüssel
21. **Pfadausbruch** (`/../src/RepairCenter.Server.ps1`) wird abgewiesen
22. Lauf über die API starten, verfolgen, abschließen; Bericht in den Formaten
    TXT, JSON, Werkzeug-Log und Transcript abrufbar

### Datenträgerverwaltung (neu in 1.1.0)
23. Bestandsaufnahme liefert Datenträger samt Volumes und Schutzkennzeichnung
24. **Systemdatenträger wird immer verweigert** – auch mit korrektem Schlüssel
25. Ohne exakten Bestätigungsschlüssel passiert nichts (leer, falsch, richtig geprüft)
26. Verfahrenswahl: BitLocker → `CryptoErase`, SSD → `Trim`, HDD → `Zero`;
    eine ausdrückliche Wahl schlägt die Automatik
27. Dauerschätzung plausibel: Sekunden für `CryptoErase`/`Trim`, Stunden für
    8 TB mit Nullen, doppelte Dauer mit Prüfdurchlauf
28. **FAT32-Formatierer erzeugt einen gültigen Bootsektor** (64 GB): Sprungbefehl,
    Signatur `0x55AA`, Sektorgröße, Kennung `FAT32`, Wurzelverzeichnis in
    Cluster 2, Sektoranzahl, FSInfo-Signatur – Byte für Byte nachgerechnet
29. FAT32 jenseits der Windows-Grenze: 2 TiB möglich, 4 TiB mit 512-Byte-Sektoren
    wird mit verständlicher Begründung abgelehnt
30. **Nullschreiber überschreibt tatsächlich alles**: 16 MiB mit Testmuster
    gefüllt, nach dem Lauf kein einziges Byte ungleich null
31. Löschen im Demomodus meldet Fortschritt und gewähltes Verfahren
32. Löschen des Systemdatenträgers scheitert auch direkt in der Engine
33. Dateisystemwechsel: FAT32 → NTFS verlustfrei; NTFS → exFAT nur nach
    ausdrücklicher Zustimmung

### Backend (Datenträger-Endpunkte)
34. `GET /api/disks` liefert die Bestandsaufnahme inklusive Schutzstatus
35. `GET /api/disk/estimate` liefert Verfahren, Dauer und Bestätigungsschlüssel
36. Löschauftrag über die API läuft durch und endet bei 100 %
37. Löschauftrag auf den Systemdatenträger scheitert kontrolliert mit Begründung

### Datenrettung und Wechselmedien (neu in 1.2.0)
38. USB-Sticks und Speicherkarten werden erkannt (SD, MMC, USB klein/HDD/SSD,
    NVMe, SATA) – sieben Kombinationen geprüft
39. Bestandsaufnahme führt Wechselmedien mit Art und Kennzeichnung
40. Sicherungsziele schließen den Quelldatenträger aus
41. **Robocopy-Argumente setzen auf Tempo**: `/MT:32`, `/J`, `/R:1`, `/XJ` –
    und enthalten nachweislich **nicht** den bremsenden Wiederaufnahmemodus `/Z`
42. Datenrettung meldet Fortschritt mit Abschnittskennzeichnung
43. Ein Ziel auf dem zu löschenden Datenträger wird abgelehnt
44. **Zu wenig Platz am Ziel stoppt die Rettung vorher** (49 GB Daten auf eine
    Karte mit 29 GB frei)
45. `GET /api/disk/targets` und `/api/disk/measure` liefern die Planungsdaten
46. **Sichern und danach Löschen läuft als verketteter Auftrag** – zwei
    Abschnitte, beide bestanden
47. **Scheitert die Sicherung, wird nichts gelöscht** – Abschnitt `wipe`
    existiert dann gar nicht erst

### Schutz des Dienstes und Projektregeln (neu in 1.2.1)
48. **Schreibende Anfrage ohne Zusatzkopf wird abgewiesen** (403)
49. **Anfrage mit fremder Herkunft wird abgewiesen** (403)
50. **Vorabanfragen (OPTIONS) werden nicht beantwortet** (405)
51. **Eingeschleuste Zusatzparameter werden abgewiesen** (400) – vier Fälle:
    Zusatzparameter im Laufwerksbuchstaben, unbekanntes Dateisystem,
    Anführungszeichen in der Bezeichnung, unbekanntes Feld
52. **Unsinnige Zahlenwerte werden abgewiesen** (400) – vier Fälle inklusive
    Pfad mit `..`
53. **Zwei Datenträgervorgänge gleichzeitig werden verhindert** (409)
54. **Auftrags-IDs sind auch im selben Sekundentakt eindeutig** – 500 Erzeugungen
    in einer Schleife, alle verschieden, Form geprüft
55. `GET /api/disk/active` meldet den laufenden Vorgang samt Auftrags-ID
56. **Versionsnummer ist im ganzen Projekt gleich** – der Test ruft
    `tools/Update-Version.ps1 -Check` auf und scheitert bei Abweichung
57. CHANGELOG führt die aktuelle Version

58. **Ein frisch gestarteter Lauf ist sofort abfragbar** – ohne Wartezeit,
    kein 404-Fenster
59. **Kennungen sind auch im selben Sekundentakt eindeutig** – je 2000
    Ziehungen für Aufträge und Läufe

### Kompatibilität
59. Quelltext ist zu Windows PowerShell 5.1 kompatibel

## Oberflächentests (29)

Gegen eine Attrappe des Backends, ohne Browser und ohne laufenden Dienst.

- **Grundzustand (6):** Deutsch als Vorgabe · dunkles Design als Vorgabe ·
  alle sechs Reiter · Vollständigkeit aller Bedienelemente (4 Modi, 4 Stufen,
  6 Schalter, 3 Zahlenfelder, Start/Abbrechen) · alle fünf Testszenarien
  wählbar · Systemdaten werden angezeigt · Demomodus aus der Konfiguration
- **Sprache (4):** Umschalten DE → EN ändert alle Beschriftungen · zurück nach DE ·
  beide Pakete schlüsselgleich · jeder im HTML verwendete Schlüssel existiert
- **Design (1):** Umschalten hell/dunkel
- **Eingaben und Start (5):** Formular wird vollständig in die Anfrage übernommen ·
  Diagnose erzwingt Stufe „Keine" · Aggressiv blendet die Warnung ein ·
  Start sendet `POST /api/run` · Abbrechen sendet den Abbruchbefehl
- **Laufanzeige (5):** Schritte, Befunde, Protokoll, Status und Speicherbilanz ·
  Neustart-Hinweis mit Begründung · Werkzeugzeilen ausblendbar ·
  Neustart ruft die API · **Fremdtext wird escaped** (`<img onerror=…>` erzeugt
  kein Element)
- **Verlauf und Bericht (3):** Verlauf mit übersetztem Ergebnis · Klick auf
  „Bericht" wechselt den Reiter und lädt den Text · Formatumschaltung fordert
  `?format=cbs` an
- **Planung (4):** Zustand der Aufgabe · Anlegen sendet die gewählten Werte ·
  Entfernen sendet `DELETE` · Dienstdaten werden angezeigt
- **Schutz vor fremden Webseiten (3, neu in 1.2.1):** jede Anfrage trägt den
  Zusatzkopf · auch schreibende Anfragen zusätzlich zum Inhaltstyp · auch der
  Abruf von Berichten
- **Datenrettung (7, neu in 1.2.0):** Bereich zunächst eingeklappt · Einschalten
  lädt Ziele und ermittelt die Datenmenge · passendes Ziel wird bestätigt ·
  **zu kleines Ziel blockiert den Start trotz richtigem Schlüssel** · mit
  passendem Ziel wird freigegeben · Anfrage enthält Ziel, Verfahren, Fäden und
  Puffereinstellung · beide Abschnitte werden mit Zustand angezeigt
- **Datenträger (11):** Reiter samt Warnhinweis · alle Datenträger mit
  Kennwerten · **Systemdatenträger bietet weder Löschen noch Formatieren an** ·
  freie Datenträger bieten beides · Löschdialog zeigt Verfahren und geschätzte
  Dauer · **Ausführen bleibt gesperrt, bis der Schlüssel exakt stimmt**
  (leer, unvollständig, falscher Datenträger, korrekt in Kleinschreibung) ·
  Start sendet Verfahren, Blockgröße, Warteschlangentiefe und Bestätigung ·
  Fortschritt zeigt Prozent, Datenmenge, Durchsatz und Restzeit · Abschluss
  beendet die Abfrage · Dateisystemwechsel weist verlustfrei/verlustbehaftet
  korrekt aus · Größen- und Zeitformatierung

## Gefundene und behobene Fehler

| Fund | Wirkung | Behoben |
|---|---|---|
| `break` in einem `finally`-Block | Windows PowerShell 5.1 bricht den Start mit `ControlLeavingFinally` ab – PowerShell 7 akzeptiert es klaglos | if/elseif statt switch; eigener Linter prüft die Regel dauerhaft |
| `$ErrorActionPreference = 'Stop'` bei nativen Werkzeugen | jede stderr-Zeile (z. B. von chkdsk) hätte den Schritt als FEHLER beendet | lokal auf `Continue` gesetzt und danach zurückgesetzt |
| `$PSBoundParameters` innerhalb einer Funktion | beim UAC-Neustart wären alle Parameter verloren gegangen | werden ausdrücklich übergeben |
| „Enter zum Schließen" auch ohne Konsole | ein Lauf im Taskplaner wäre endlos hängen geblieben | nur noch bei `[Environment]::UserInteractive` |
| Wiederherstellungspunkt fehlte im Modul | das README versprach ihn bereits | `New-SafetyRestorePoint` ergänzt und getestet |
| `tools.log` wurde nicht angelegt, wenn kein Werkzeug lief | 404 im Berichtsreiter | Datei wird jetzt immer mit Kopfzeile erzeugt |
| Linter meldete Fehlalarme auf Zeichenketten (`\??\C:\…`) | unbrauchbare Prüfergebnisse | Umstellung von Regex auf Tokenstrom |
| FAT32: `TotSec32` lief bei 2 TiB über (32-Bit-Feld) | stilles Erzeugen eines kaputten Dateisystems | Grenze wird geprüft und mit Rechenweg gemeldet |
| FAT32: Clusterzahl über der Grenze bei 14 TiB | Formatierung schlug ab 8 TiB fehl | Clustergröße wächst ab 2 TiB auf 64 KiB |
| FAT-Bereich wurde sektorweise genullt | bei großen Datenträgern minutenlang | Blockbetrieb (4 MiB) und Schnellweg nach einem Nulllauf |
| `scrollIntoView` fehlt in manchen Umgebungen | Oberfläche brach beim Öffnen des Löschdialogs ab | abgesicherter Aufruf |
| `@(Invoke-RestMethod …)` direkt geschachtelt | Test zählte 1 statt 3 Datenträger (PSObject-Hülle bleibt erhalten) | erst zuweisen, dann `@()` – im Test dokumentiert |
| **Kein Schutz gegen Anfragen fremder Webseiten** | eine beliebige Seite im Browser hätte einen Löschauftrag starten können – im Versuch bestätigt | Zusatzkopf verlangt, Vorabanfragen abgelehnt, fremde Herkunft abgewiesen |
| **Eingaben ungeprüft in Prozessargumenten** | `"driveLetter":"E -Demo -Full"` wurde angenommen | Positivlisten für jedes Feld, unbekannte Felder abgelehnt |
| **Sperre wirkte erst, wenn der Auftragsprozess lief** | im Startfenster von ~1 s kam ein zweiter Löschauftrag durch | Sperre wird beim Start gesetzt, nicht beim ersten Zustandsschreiben |
| **Auftrags-IDs kollidierten im selben Sekundentakt** | zwei Aufträge hätten sich die Ablage geteilt | vier Zufallszeichen an der ID |
| **`Install.cmd` trug Version 1.0.0** | falscher Eintrag in „Apps & Features" | Versionswerkzeug pflegt jetzt auch diese Stelle |
| **PSScriptAnalyzer lief nie über die Projektdateien** | 85 unbemerkte Befunde, falsche Aussage im Bericht | abgearbeitet, Einstellungsdatei, eigener CI-Schritt |

## Was noch aussteht

Ehrlich benannt – diese Punkte konnten in der Prüfumgebung (Linux) **nicht**
abgedeckt werden:

- Echte Aufrufe von `dism.exe`, `sfc.exe`, `chkdsk.exe`, `Optimize-Volume`,
  `Checkpoint-Computer` und `schtasks.exe`. Sie sind logisch und über Attrappen
  abgesichert, aber nicht real ausgeführt.
- **Datenträgerverwaltung an echter Hardware.** Geprüft wurden: die
  Sicherheitsabfragen, die Verfahrenswahl, die Dauerschätzung, der
  FAT32-Formatierer gegen Abbilder (zusätzlich unabhängig mit `fsck.vfat`
  bestätigt und mit `mcopy`/`mtype` beschrieben und wieder gelesen) sowie der
  Nullschreiber gegen eine Datei. **Nicht** geprüft: `CreateFileW` auf
  `\\.\PhysicalDriveN`, das Aushängen von Volumes, `Clear-Disk`,
  `Disable-BitLocker`, der tatsächliche `robocopy`-Lauf und der real erreichte
  Durchsatz auf echten Laufwerken. Diese Pfade brauchen einen Windows-Rechner mit einem
  Datenträger, den man opfern darf.
- Die UAC-Rechteerhöhung und die Sysnative-Behandlung.
- Der Inno-Setup-Build (`iscc installer\RepairCenter.iss`) und die Installation
  auf einem frischen Windows.
- Darstellung in Edge/Chrome unter Windows (die Oberflächentests laufen in jsdom,
  nicht in einer echten Render-Engine).

Vor der Veröffentlichung sollten diese Punkte auf einem Windows-Testrechner
nachgeholt werden – die Liste steht in [VEROEFFENTLICHUNG.md](VEROEFFENTLICHUNG.md).
