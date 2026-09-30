# 4. GitHub Release veröffentlichen / Publish GitHub Release

## Deutsch

1. Auf **Releases** → **Draft a new release** gehen.
2. Tag: `v1.2.1`. Titel: `AI Deep Review Prompt Pack v1.2.1`.
3. Target: Branch `main`.
4. Inhalt von `RELEASE_NOTES_v1.2.1.md` in die Beschreibung kopieren.
5. Genau diese drei Dateien als Release-Artefakte hochladen:
   - `ai-deep-review-prompt-pack-v1.2.1.zip`
   - `ai-deep-review-prompt-pack-v1.2.1.zip.sha256`
   - `RELEASE_NOTES_v1.2.1.md`
6. **Nicht** zusätzlich hochladen: entpackte Repository-Dateien, ältere ZIPs, Workspace-Dateien, Caches,
   `.git`-Daten, Logs, Testdaten oder Secrets.
7. Prüfe nach Upload den SHA-256-Wert der ZIP gegen die `.sha256`-Datei.
8. „Set as the latest release“ auswählen und veröffentlichen.

## English

1. Open **Releases** → **Draft a new release**.
2. Tag: `v1.2.1`. Title: `AI Deep Review Prompt Pack v1.2.1`.
3. Target: branch `main`.
4. Copy the content of `RELEASE_NOTES_v1.2.1.md` into the release description.
5. Upload exactly these three release assets:
   - `ai-deep-review-prompt-pack-v1.2.1.zip`
   - `ai-deep-review-prompt-pack-v1.2.1.zip.sha256`
   - `RELEASE_NOTES_v1.2.1.md`
6. Do **not** additionally upload extracted repository files, older ZIPs, workspace files, caches,
   `.git` data, logs, test data, or secrets.
7. After upload, verify the ZIP SHA-256 against the `.sha256` file.
8. Select “Set as the latest release” and publish.
