# EL Rumsan

A Monorepo for Rahat Core

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

Step 3: Copy .env.example to .env and update the environment variables

```bash
  cp .env.example .env
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
