#!/usr/bin/env bash
# Build an .rpm package of Easy-Share (install with: sudo dnf install ./dist/easy-share-*.rpm)
# Requires rpmbuild (Fedora: sudo dnf install rpm-build, Debian/Ubuntu: sudo apt install rpm).
#
# Usage: scripts/build-rpm.sh [--skip-package]
#   --skip-package  reuse an existing dist/linux-unpacked instead of running electron-builder
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v rpmbuild >/dev/null 2>&1; then
  echo "rpmbuild not found. Install it with 'sudo dnf install rpm-build' (or 'sudo apt install rpm')." >&2
  exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
APPDIR="$ROOT/dist/linux-unpacked"

if [[ "${1:-}" != "--skip-package" ]]; then
  npx --no-install electron-builder --linux dir
fi

if [[ ! -x "$APPDIR/easy-share" ]]; then
  echo "Missing $APPDIR/easy-share: run electron-builder --linux dir first." >&2
  exit 1
fi

TOPDIR="$(mktemp -d)"
trap 'rm -rf "$TOPDIR"' EXIT

rpmbuild -bb "$ROOT/packaging/easy-share.spec" \
  --define "_topdir $TOPDIR" \
  --define "_es_version $VERSION" \
  --define "_es_appdir $APPDIR" \
  --define "_es_icon $ROOT/public/icon.png"

find "$TOPDIR/RPMS" -name '*.rpm' -exec cp -v {} "$ROOT/dist/" \;
