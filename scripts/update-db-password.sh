#!/bin/bash

# Script to update database password in .env file
# Usage: ./scripts/update-db-password.sh YOUR_PASSWORD

if [ -z "$1" ]; then
  echo "Usage: ./scripts/update-db-password.sh YOUR_PASSWORD"
  exit 1
fi

PASSWORD="$1"
ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

# Escape special characters in password for sed
ESCAPED_PASSWORD=$(printf '%s\n' "$PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')

# Update the password in .env file
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/****************/$ESCAPED_PASSWORD/g" "$ENV_FILE"
else
  # Linux
  sed -i "s/****************/$ESCAPED_PASSWORD/g" "$ENV_FILE"
fi

echo "✅ Database password updated in $ENV_FILE"
echo "⚠️  Note: Make sure to keep your password secure and never commit .env to git"

