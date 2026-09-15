#!/bin/bash
VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r major minor patch <<< "$VERSION"
NEW_PATCH=$((patch + 1))
NEW_VERSION="$major.$minor.$NEW_PATCH"

echo "Incrementing version to $NEW_VERSION"
npm version $NEW_VERSION --no-git-tag-version

# Replace APP_VERSION in source files
sed -i "s/const APP_VERSION = 'v.*';/const APP_VERSION = 'v$NEW_VERSION';/" src/components/DashboardLayout.js
