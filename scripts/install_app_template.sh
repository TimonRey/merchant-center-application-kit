#!/usr/bin/env bash

set -e

TEMPLATE=$1

if [ -z "$TEMPLATE" ]; then
  echo "Provide a template name (e.g. starter)"
  exit 1
fi

TEMPLATE_VERSION="${TRAVIS_PULL_REQUEST_BRANCH:-$TRAVIS_BRANCH}"
TEST_APP_NAME=test-install-app-starter
REPO_BINARIES=$(yarn bin)

packageNames=()

echo "==> Linking all packages"
for pkgDir in packages/*; do
  pkgName=$(basename "$pkgDir")
  yarn --cwd "$pkgDir" link
  packageNames=("${packageNames[@]}" "@commercetools-frontend/$pkgName")
done

pushd "$HOME"

echo "==> Installing application for template $TEMPLATE (version: $TEMPLATE_VERSION)"
node "$REPO_BINARIES/create-mc-app" \
  --template="$TEMPLATE" \
  --template-version="$TEMPLATE_VERSION" \
  --skip-install \
  "$TEST_APP_NAME"

pushd "$HOME/$TEST_APP_NAME"

echo "==> Installing linked packages"
for pkgName in "${packageNames[@]}"; do
  yarn --cwd "$TEST_APP_NAME" link "$pkgName"
done

echo "==> Installing application dependencies"
yarn --cwd "$TEST_APP_NAME" install

echo "==> Running tests for template $TEMPLATE"
yarn --cwd "$TEST_APP_NAME" test

echo "==> Running the production build of template $TEMPLATE"
yarn --cwd "$TEST_APP_NAME" build
