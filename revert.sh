#! /bin/bash

echo "Reverting database hosts in .env file."
sed -i "s/^DB_HOST=.*/DB_HOST=localhost/" .env
sed -i "s/^REDIS_HOST=.*/REDIS_HOST=localhost/" .env

NEW_DB_URL='postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public'

sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${NEW_DB_URL}|" .env
echo ".env file updated"
