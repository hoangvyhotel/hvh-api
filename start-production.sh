#!/bin/bash

# Set memory limit for low-RAM hosting (512MB)
export NODE_OPTIONS="--max-old-space-size=512"

# Prisma environment variables for shared hosting
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
export PRISMA_QUERY_ENGINE_LIBRARY_SEARCH_PATH="/usr/lib/x86_64-linux-gnu"

# Setup aliases and start server
node scripts/setup-aliases.js && node -r module-alias/register dist/server-prisma.js