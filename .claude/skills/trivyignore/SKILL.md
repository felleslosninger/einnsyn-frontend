---
name: trivyignore
description: Maintain this repo's .trivyignore so the CI container scan passes — reproduce both blocking Trivy scans (library HIGH/CRITICAL and OS CRITICAL) locally against a fresh linux/amd64 build of the Dockerfile with the bundled script, fix by bumping a dependency or the base image before suppressing, suppress only with a verified rationale, and delete entries whose package has moved past the fix version. Use whenever the Deploy workflow's build job fails on Trivy or a CVE, when a Dependabot, Next.js, or node:24-alpine bump lands, when asked to run Trivy "like CI" or check whether the image scan will pass, or when asked to review, update, or clean up .trivyignore — even if the user only mentions a CVE ID or "vulnerability scan".
---

# Maintaining .trivyignore

## How CI runs Trivy

Verified against the shared workflows on 2026-09-24 — trust this section rather than re-deriving
it, but re-check if `felleslosninger/github-workflows` changed materially. Each file below is one
`curl https://raw.githubusercontent.com/felleslosninger/github-workflows/main/<path>` away.

- [`deploy.yml`](../../../.github/workflows/deploy.yml) and
  [`deploy-autorisasjon.yml`](../../../.github/workflows/deploy-autorisasjon.yml) call
  `.github/workflows/ci-build-publish-image.yml` with `application-type: docker`, which forwards
  to `.github/workflows/ci-docker-build-publish-image.yml`. That runs
  `docker build --file ./Dockerfile .` on ubuntu (linux/amd64, no layer cache) and hands the image
  to the shared `.github/actions/trivy-scan` composite action.
- **Both scans block.** The docker workflow hard-codes `os-exit-code: "1"` where the action's own
  default is informational:
  - library: `--pkg-types library --severity HIGH,CRITICAL --ignore-unfixed --skip-dirs layers,cnb --exit-code 1`
  - os: `--pkg-types os --severity CRITICAL --ignore-unfixed --exit-code 1`
- `--ignore-unfixed` on both, so only findings with a published fix can fail the build.
- The action does not set `--scanners`, so Trivy's default `vuln,secret` applies: a HIGH secret
  finding in the image fails the build just like a CVE.
- The scan runs on push to `main` and `autorisasjon`, not on PRs (`test.yml` has no scan), so a
  new finding surfaces as a failed Deploy run after merge and blocks every deploy until resolved.
- A root `.trivyignore` is auto-detected. The action warns above 10 entries. Its pinned
  trivy-action defaults to Trivy v0.70.0; keep the local `trivy` on the same minor.

## Reproduce the blocking scans locally

Run the bundled script from anywhere in the repo:

```bash
.claude/skills/trivyignore/scripts/ci-scan.sh            # build + both scans + summary
.claude/skills/trivyignore/scripts/ci-scan.sh --no-build # re-scan after editing .trivyignore
.claude/skills/trivyignore/scripts/ci-scan.sh --rm       # also remove the local image when done
```

It refreshes the DB, builds `einnsyn-frontend-next:trivy-local` for linux/amd64 with `--pull` and
`--no-cache-filter runner`, runs both CI scans with `--show-suppressed`, and lists unfixed
HIGH/CRITICAL findings that will start blocking once a fix is published. It prints the base image
digest it actually built from — quote that, not `docker image inspect node:24-alpine`, whose
docker-store tag can be weeks stale while BuildKit resolves `FROM` against the registry.

Things that will silently mislead you:

- **Scan the image, not the repo.** `trivy fs .` reads `package-lock.json` and flags dev
  dependencies that never ship — the Dockerfile prunes them and deletes npm, so the image is the
  only truthful target. Conversely, an `npm audit` finding is not a CI finding unless the package
  is in the image.
- **Build for linux/amd64.** The runtime `node_modules` carries platform-specific packages
  (`@next/swc-linux-x64-musl`, `@img/sharp-*-x64`, `@parcel/watcher-linux-x64-*`); an arm64
  build ships different ones. `PLATFORM=linux/arm64` is fine for a quick look, but confirm on
  amd64 before suppressing anything or declaring CI green. Emulation works on Apple Silicon; the
  build just takes a few minutes longer.
- The CLI flags are `--pkg-types` and `--ignorefile`. `vuln-type` and `trivyignores` are the
  action's input names and are fatal unknown flags to the CLI.

## Deciding what to do with a finding

Only findings with a fix version can block, so there is always a version to move to.

1. **Fix it before suppressing.**
   - Library: `npm ls <package>` shows who pulls it in. Bump that direct dependency — Dependabot
     opens one PR per security fix, so check for an open one first. If the fix only exists in
     the transitive package and its parent has no release yet, an `overrides` entry in
     `package.json` is the last resort: it is a pin the project has to remember to remove, so
     give it the same removal-condition comment an ignore entry gets.
   - OS: the Dockerfile tracks `node:24-alpine`, so a plain rebuild picks up the fix once the
     node image is rebuilt on patched Alpine. If Alpine has shipped the fix but the node image
     lags, add `apk upgrade --no-cache` to the runner stage's existing `apk` line instead of
     suppressing.
2. **Suppress only when no fix is reachable** — the fix is a major bump the parent has not
   adopted, or it does not exist yet. Get the real CVE facts from
   `https://cveawg.mitre.org/api/cve/<CVE-ID>`, then verify the non-exploitability claim against
   this codebase — grep for the affected API, don't assume. "Only runs at build time" is a common
   valid rationale here, because the runner copies the whole pruned `node_modules` including
   Next's compiler toolchain, but it needs the same verification. If you cannot substantiate
   the claim, say so rather than suppressing on a guess. A temporary suppression while a fix is
   pending is acceptable because a red scan blocks every deploy, but its removal condition must
   name what to wait for.
3. **Delete dead entries.** Anything the script does not list under `suppressed` is dead: the
   package has moved past the fix version. Every entry in the file must correspond to a live
   finding.

## Entry format

Group CVEs that share a single version bump under one comment block. Open with the removal
condition, then the concrete reason it cannot reach us. Illustrative:

```
# Remove once next pulls picomatch 4.0.4 or later (npm ls picomatch). ReDoS in
# extglob pattern parsing. Not reachable: picomatch only runs during `next build`
# to match files against patterns from next.config.ts, never against request
# input, and the runner image never runs `next build`.
CVE-2026-33671
```

## Reporting

State both exit codes, the blocking and suppressed counts, and what was scanned, so the reader
can tell a genuine pass from a stale or wrong-platform one — e.g.
`library: blocking 0, suppressed 1, exit=0` / `os: blocking 0, exit=0` /
`linux/amd64 from node:24-alpine@sha256:ebfe2f90…`. When suppressing, quote the verification
(the grep or the CVE record) that backs the rationale.
