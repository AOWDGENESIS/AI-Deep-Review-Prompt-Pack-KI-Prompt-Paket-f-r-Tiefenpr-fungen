# Release Checklist / Release-Checkliste

## Deutsch

- [ ] Version in `VERSION`, README, CHANGELOG und Release Notes ist identisch.
- [ ] Deutscher und englischer Prompt enthalten dieselbe Zahl und dieselben fachlich äquivalenten Profile.
- [ ] Alle neuen Referenzen sind HTTPS-URLs und bevorzugt Primärquellen.
- [ ] Keine Secrets, personenbezogenen Daten, Build-Caches, `.git/`-Daten oder fremden Dateien enthalten.
- [ ] `python3 scripts/validate_release.py` endet mit Status 0.
- [ ] `RELEASE_MANIFEST.sha256` wurde nach der letzten Inhaltsänderung neu erzeugt.
- [ ] ZIP enthält genau einen Top-Level-Ordner: `ai-deep-review-prompt-pack-v1.2.1/`.
- [ ] GitHub Release enthält nur das ZIP, dessen SHA-256 und die zugehörigen Release Notes.

## English

- [ ] Version in `VERSION`, README, CHANGELOG, and release notes is identical.
- [ ] German and English prompts contain the same number of semantically equivalent profiles.
- [ ] Every new reference is an HTTPS URL and preferably a primary source.
- [ ] No secrets, personal data, build caches, `.git/` data, or unrelated files are included.
- [ ] `python3 scripts/validate_release.py` exits with status 0.
- [ ] `RELEASE_MANIFEST.sha256` was regenerated after the final content change.
- [ ] ZIP contains exactly one top-level directory: `ai-deep-review-prompt-pack-v1.2.1/`.
- [ ] The GitHub Release contains only the ZIP, its SHA-256, and the matching release notes.
