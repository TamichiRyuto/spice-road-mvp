#!/bin/bash
set -e

echo "Initializing database schema..."

# Set PGPASSWORD environment variable for psql
export PGPASSWORD="$DB_PASSWORD"

# Wait for database to be ready
echo "Waiting for database connection..."
for i in {1..30}; do
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo "Database connection successful"
    break
  fi
  echo "Waiting for database... ($i/30)"
  sleep 2
done

# Apply schema
echo "Applying database schema..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/schema.sql

# Import shop data
echo "Importing shop data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/import_shops.sql

echo "Database schema and data initialized successfully"

# Start the application on port 8080 (internal)
# nginx listens on port 8081 (external) and proxies to 8080
echo "Starting API server on port 8080..."
export API_PORT=8080
exec /app/spice_curry_api_server
