# EL Rumsan

A Monorepo for EL applications

## Prerequisite

- Postgres Database OR Docker compose
- Node.js v20.\* (Recommended)
- NestJS/CLI Installed
- Redis Database Server OR Docker compose

## Run Locally

Setp 1: Clone the project

```bash
  git@github.com:el-rumsan/rahat-platform-nx.git
```

Step 2: Go to the project directory and install dependencies

```bash
  cd my-project
  pnpm install
```

Step 3: Add following details to .env file inside project root directory.

```bash
PORT=5501
PORT_BEN=5502
PRIVATE_KEY=

# Jwt
JWT_EXPIRATION_TIME=24h
JWT_EXPIRATION_LONG_TIME=180000

# OTP
OTP_DURATION_IN_SECS=300

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=


# Postgres envioroment variables

# Nest run in docker, change host to database container name
# DB_HOST=postgres
DB_HOST=localhost
DB_PORT=5437
DB_USERNAME=postgres
DB_PASSWORD=root
DB_NAME=db_el

# Prisma database connection
DATABASE_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public
```

Step 4: Migrate and seed prisma db

```bash
  npx prisma migrate dev
```

Seed database with

```bash
  npx prisma db seed
```

Step 5: Run project

```bash
  pnpm rahat
```

```bash
  pnpm beneficiary
```

Step 6: Visit API docs at: http://localhost:5501/swagger
