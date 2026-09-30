# 2. Inhalt hochladen / Upload content

## Deutsch

### Variante A — Git über Terminal

1. ZIP entpacken.
2. In den entpackten Ordner `ai-deep-review-prompt-pack-v1.2.1/` wechseln.
3. Vor dem Upload prüfen: `python3 scripts/validate_release.py`.
4. Initialisieren und hochladen:

```bash
git init
git branch -M main
git add .
git commit -m "Release prompt pack v1.2.1"
git remote add origin https://github.com/ORG_OR_USER/ai-deep-review-prompt-pack.git
git push -u origin main
```

5. Prüfen, dass nur die entpackten Release-Dateien hochgeladen wurden. Insbesondere nicht hinzufügen:
   ZIP-Datei, lokale `.git`-Kopie, Caches, `node_modules`, virtuelle Umgebungen, Testdaten, Logs oder Secrets.

### Variante B — GitHub-Weboberfläche

1. Im leeren Repository **uploading an existing file** wählen.
2. Den **Inhalt** von `ai-deep-review-prompt-pack-v1.2.1/` hochladen, nicht den Ordner einer anderen Version,
   nicht die ZIP-Datei und keine übergeordneten Workspace-Dateien.
3. Commit message: `Release prompt pack v1.2.1`.
4. Nach dem Upload Dateibaum mit dem Release-Manifest vergleichen.

## English

### Option A — Git terminal

1. Extract the ZIP.
2. Change into `ai-deep-review-prompt-pack-v1.2.1/`.
3. Validate before upload: `python3 scripts/validate_release.py`.
4. Initialize and push:

```bash
git init
git branch -M main
git add .
git commit -m "Release prompt pack v1.2.1"
git remote add origin https://github.com/ORG_OR_USER/ai-deep-review-prompt-pack.git
git push -u origin main
```

5. Confirm that only extracted release files were uploaded. Do not add the ZIP, a local `.git` copy,
   caches, `node_modules`, virtual environments, test data, logs, or secrets.

### Option B — GitHub web interface

1. In the empty repository, choose **uploading an existing file**.
2. Upload the **contents** of `ai-deep-review-prompt-pack-v1.2.1/`, not another version’s folder,
   not the ZIP itself, and not parent workspace files.
3. Commit message: `Release prompt pack v1.2.1`.
4. Compare the uploaded tree with the release manifest.
