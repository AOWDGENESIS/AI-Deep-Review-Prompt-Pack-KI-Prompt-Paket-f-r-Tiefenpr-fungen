# Changelog

This project follows [Semantic Versioning](https://semver.org/).

## [1.2.2] - 2026-09-30

### Fixed

- Restored hidden repository files `.github/`, `.gitignore`, and `.gitattributes` that were absent from the remote GitHub checkout.
- Made `scripts/validate_release.py` work in both an isolated release directory and a normal Git checkout.
- Clarified GitHub upload instructions to preserve dotfiles and `.github` content.

### Verified

- Fresh-clone validation, release-manifest integrity, master/standalone profile parity, and ZIP isolation.

## [1.2.1] - 2026-09-30

### Fixed

- Replaced broken or imprecise NIST, OWASP API, OWASP Java, Groovy, and Clojure reference URLs in master and standalone prompts.
- Corrected GitHub Issue Form files to include required unique `id` fields.
- Strengthened the local release validator with source-profile parity, code-fence, and standalone-file checks.

### Added

- Optional, safe CODEOWNERS template and bilingual setup instructions.
- Deep quality-assurance record for this release.

## [1.2.0] - 2026-09-30

### Added

- 41 self-contained, bilingual standalone prompts in `prompts/standalone/`, one for every covered profile.
- Machine-readable `PROFILE_MANIFEST.json` and a bilingual standalone prompt index.
- Bilingual `github-setup/` instructions for repository creation, upload, security settings, and release publication.
- Release-validator checks for standalone prompt count, profile manifest, and GitHub setup documents.

## [1.1.0] - 2026-09-30

### Added

- German and English agent-interoperability contract: YAML/JSON input, optional JSON/SARIF output,
  evidence status, and explicit minimal-patch policy.
- Universal-core sections on threat modeling, release governance, software supply chain,
  license/provenance review, and false-positive discipline.
- Nine additional, mirrored profiles: API; NoSQL/cache/message store; GitHub Actions/CI-CD;
  Android; AI/LLM/agent/RAG; Ada/SPARK; Fortran; COBOL/mainframe; other JVM languages.
- Completeness audit, GitHub-ready project documents, release-isolation guide, local release validator,
  and a SHA-256 release manifest.

### Changed

- Expanded profile parity from 32 to 41 profiles in each language edition.
- Clarified that the Discovery profile remains mandatory for unlisted languages.

## [1.0.0] - 2026-09-30

### Added

- Initial bilingual master prompts, universal review core, 32 language/artifact profiles,
  and online reference registry.
