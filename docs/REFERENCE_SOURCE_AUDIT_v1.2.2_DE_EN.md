# Reference Source Audit / Referenzquellen-Audit

**Review date / Prüfdatum:** 2026-10-09
**Repository version / Version:** 1.2.2
**Branch under review / Prüfbranch:** `hardening/ci-release-gate`
**Scope / Umfang:** Sampled review of the 93 unique URLs extracted from the German and English master prompts and the standalone profile manifest. This is not a complete HTTP status audit of every link.

## Findings

| Priority | Reference | Assessment | Recommended treatment |
|---|---|---|---|
| Medium | Apple Secure Coding Guide: https://developer.apple.com/library/archive/documentation/Security/Conceptual/SecureCodingGuide/Introduction.html | Official Apple-hosted documentation, but archived. The revision history shows its latest listed update is from 2016. | Retain only as historical background. Prefer current Apple Developer documentation for platform-specific guidance and date the reference. |
| Medium | Groovy documentation: https://docs.groovy-lang.org/docs/next/html/documentation/#_security | The `next` documentation path is inherently moving and may change between releases. | Prefer a versioned release URL where available, or explicitly label it as a moving reference and recheck it before release. |
| Medium | SEI CERT Coding Standards: https://cmu-sei.github.io/secure-coding-standards/ | Official SEI CERT-hosted development material. The site describes the standards as community-developed; individual pages state that work-in-progress content can be incomplete or contain errors. | Use as maintained guidance, not as a frozen normative baseline. Where conformance matters, cite a published edition and its errata. |
| Low | NIST SP 800-218 and SP 800-218A | Official NIST publications. SP 800-218A is the final AI/dual-use foundation model community profile, published July 2024; SP 800-218 is the SSDF v1.1 publication from February 2022. | Keep both, but identify publication/version and use the AI profile in conjunction with the base SSDF rather than as a replacement. |
| Low | AdaCore SPARK User's Guide | The sampled URL resolves to the live AdaCore documentation and the expected usage-scenarios chapter. | Keep; treat `live/wave` as a moving documentation target and record the guide version when a review relies on specific details. |

## Audit limitations

- The source inventory contains 93 unique URLs, but this audit sampled representative sources rather than making an HTTP request to every URL.
- Search/index evidence establishes that the sampled pages are discoverable and their content matches the descriptions above. It does not prove every URL is free of redirects, works from every network, or will remain stable.
- No claim is made that all references have been exhaustively checked for HTTP status, redirect chains, version freshness, or technical accuracy.
- The profile regression tests currently check HTTPS syntax and obvious placeholders. They do not establish that a source is authoritative, current, or reachable.

## Follow-up actions

1. Add a scheduled or manually triggered link audit that checks redirects and final HTTP status without following page content as instructions.
2. Mark moving paths such as `/next/` and `/live/` as version-sensitive in the reference register.
3. Prefer primary specifications and official security guidance; label archived and work-in-progress sources.
4. Review the complete 93-URL inventory before a release and document unreachable links, redirects, and replacement decisions.
5. Keep this audit informational. A passing link check is not proof that a source is correct or that the prompts are secure.

## Sources sampled

- Apple Secure Coding Guide revision history: https://developer.apple.com/library/archive/documentation/Security/Conceptual/SecureCodingGuide/RevisionHistory.html
- SEI CERT Coding Standards: https://cmu-sei.github.io/secure-coding-standards/
- NIST SP 800-218: https://csrc.nist.gov/pubs/sp/800/218/final
- NIST SP 800-218A: https://csrc.nist.gov/pubs/sp/800/218/a/final
- AdaCore SPARK User's Guide: https://docs.adacore.com/live/wave/spark2014/html/spark2014_ug/en/usage_scenarios.html
