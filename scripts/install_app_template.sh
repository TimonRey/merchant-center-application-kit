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

packageTars=()

echo "==> Packing all packages"
for pkg in packages/*; do
  tarName="$(basename "$pkg").tgz"
  yarn --cwd "$pkg" pack --filename "$tarName"
  packageTars=("${packageTars[@]}" "$(pwd)/${tarName}")
done

pushd "$HOME"

echo "==> Installing application for template $TEMPLATE (version: $TEMPLATE_VERSION)"
node "$REPO_BINARIES/create-mc-app" \
  --template="$TEMPLATE" \
  --template-version="$TEMPLATE_VERSION" \
  --skip-install \
  "$TEST_APP_NAME"

pushd "$HOME/$TEST_APP_NAME"

echo "==> Installing packages from tarballs"
npm install --no-save "${packageTars[@]}"

echo "==> Installing application dependencies"
npm install

echo "==> Running tests for template $TEMPLATE"
yarn test

echo "==> Running the production build of template $TEMPLATE"
yarn build
