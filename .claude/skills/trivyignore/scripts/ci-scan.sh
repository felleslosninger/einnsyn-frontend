#!/usr/bin/env bash
# Reproduces the CI Trivy scans for this repo's image with the exact flags the
# shared trivy-scan action uses (see ../SKILL.md), against a fresh linux/amd64
# build so the package set matches the GitHub runner.
#
# Usage: ci-scan.sh [--no-build] [--rm]
#   --no-build  scan the existing local image instead of rebuilding
#   --rm        remove the local image afterwards
#   PLATFORM=linux/arm64  faster native build; platform-specific npm packages
#               then differ from CI, so confirm on amd64 before suppressing
#   IMAGE=<tag> local image tag (default einnsyn-frontend-next:trivy-local)
set -uo pipefail

REPO=$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)
IMAGE=${IMAGE:-einnsyn-frontend-next:trivy-local}
PLATFORM=${PLATFORM:-linux/amd64}
IGNOREFILE="$REPO/.trivyignore"
BUILD=1 RM=0
for arg in "$@"; do
  case "$arg" in
    --no-build) BUILD=0 ;;
    --rm) RM=1 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

export TRIVY_DISABLE_VEX_NOTICE=true
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "## Refreshing the vulnerability DB"
trivy image --download-db-only --quiet
trivy --version | sed -n '1p;/UpdatedAt/{p;q;}' | sed 's/^/  /'

if (( BUILD )); then
  echo "## Building $IMAGE for $PLATFORM"
  # --pull: resolve the base tag against the registry, never a stale local tag.
  # --no-cache-filter runner: the runner stage installs curl and its libs from
  # the live Alpine index, so a cached layer can lag CI on those packages.
  if ! docker build --pull --no-cache-filter runner --platform "$PLATFORM" \
      --tag "$IMAGE" --file "$REPO/Dockerfile" "$REPO" > "$WORK/build.log" 2>&1; then
    tail -30 "$WORK/build.log"; echo "docker build failed" >&2; exit 1
  fi
  BASE=$(grep -oE 'docker\.io/library/[a-z0-9:._-]+@sha256:[0-9a-f]+' "$WORK/build.log" | sort -u | head -1)
  echo "  base resolved to ${BASE:-<digest not found in build log>}"
elif ! docker image inspect "$IMAGE" > /dev/null 2>&1; then
  echo "no local image $IMAGE; run without --no-build" >&2; exit 1
fi
echo "  image: $(docker run --rm --platform "$PLATFORM" --entrypoint sh "$IMAGE" \
  -c 'echo "node $(node --version), alpine $(cat /etc/alpine-release), $(uname -m)"')"

# scan <label> <pkg-types> <severity> [extra trivy flags...]
scan() {
  local label=$1 types=$2 sev=$3 out="$WORK/$1.json" code
  shift 3
  trivy image --quiet --format json --output "$out" \
    --pkg-types "$types" --severity "$sev" --ignore-unfixed \
    --ignorefile "$IGNOREFILE" --show-suppressed --exit-code 1 "$@" "$IMAGE"
  code=$?
  echo
  echo "## $label scan: --pkg-types $types --severity $sev --ignore-unfixed $*  =>  exit=$code"
  if [[ ! -s "$out" ]]; then echo "  trivy produced no report (error above)"; return "${code:-1}"; fi
  jq -r '
    def line: "\(.VulnerabilityID) \(.Severity) \(.PkgName) \(.InstalledVersion) -> \(.FixedVersion // "-")";
    ([.Results[]? | .Target as $t | .Vulnerabilities[]? | line + "  [\($t)]"]) as $blocking
    | ([.Results[]? | .ExperimentalModifiedFindings[]? | select(.Status == "ignored") | .Finding | line]) as $supp
    | ([.Results[]? | .Secrets[]? | "\(.RuleID) \(.Severity) \(.Title)"]) as $secrets
    | "  blocking (\($blocking | length)):", (if ($blocking | length) == 0 then "    none" else $blocking[] | "    " + . end),
      "  suppressed by .trivyignore (\($supp | length)):", (if ($supp | length) == 0 then "    none" else $supp[] | "    " + . end),
      "  secrets (\($secrets | length)):", (if ($secrets | length) == 0 then "    none" else $secrets[] | "    " + . end)
  ' "$out"
  return "$code"
}

scan library library HIGH,CRITICAL --skip-dirs layers,cnb; LIB=$?
scan os os CRITICAL; OS=$?

echo
echo "## Horizon: unfixed HIGH/CRITICAL findings (start blocking once a fix is published)"
trivy image --quiet --format json --output "$WORK/horizon.json" \
  --pkg-types os,library --severity HIGH,CRITICAL "$IMAGE"
jq -r '[.Results[]? | .Vulnerabilities[]? | select((.FixedVersion // "") == "")
        | "    \(.VulnerabilityID) \(.Severity) \(.PkgName) \(.InstalledVersion)"]
       | if length == 0 then "    none" else .[] end' "$WORK/horizon.json"

echo
echo "## Result: library exit=$LIB, os exit=$OS  (CI fails if either is non-zero)"
if (( RM )); then docker rmi "$IMAGE" > /dev/null && echo "  removed $IMAGE"; fi
exit $(( LIB || OS ))
