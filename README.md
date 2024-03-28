# Rahat Platform

## Overview
Rahat Platform serves as a monorepo specifically designed to streamline the management and advancement of Rahat Core. Rahat stands as the Aid Distribution platform powered by Blockchain Technology, revolutionizing the aid distribution process.

## Prerequisites
Before getting started, ensure that your system meets the following prerequisites:
- Postgres Database
- Node.js version 20.* (Recommended)
- NestJS/CLI Installed
- Redis Database Server

## Getting Started
To run the project locally, follow these steps:  

### Step 1: Clone the Repository
```bash
git clone git@github.com:el-rumsan/rahat-platform-nx.git
```

### Step 2: Install Dependencies
Navigate to the project directory and install dependencies using PNPM:
```bash
pnpm install
```

### Step 3: Configure Environment
Copy the provided `.env.example` file to `.env` and update the environment variables according to your configuration:
```bash
cp .env.example .env
```

### Step 4: Migrate and Seed Database
Execute the following command to migrate and seed the Prisma database:
```bash
pnpm migrate:dev
```

### Step 5: Run the Project
Initiate the project by executing the following commands in separate terminals:
```bash
pnpm rahat
pnpm beneficiary
```

### Step 6: Access API Documentation
Explore the API documentation at: [http://localhost:5501/swagger](http://localhost:5501/swagger)

Feel free to leverage and explore the functionalities provided by the project locally. Should you encounter any challenges, consult the troubleshooting section within the documentation or reach out to the project maintainers for assistance.

## Docker Development Environment

Follow the following steps to run rahat on a local docker development environment.

### Step 1

Ensure that you have the following key-value pairs in your .env file.
```text
EL_PROJECT_DIR=<path-to-your-el-project-codebase>
ENVIRONMENT=local
```

Example:
```text
EL_PROJECT_DIR=/home/user/rumsan/projects/rahat/rahat-projects
ENVIRONMENT=local
```


Run the following command and follow the instructions.

```sh
bash setup.sh
```

### Step 2

Go to your rahat deployment worker's directory.
Ensure that for configurations, `REDIS_PORT` is set to `9736` in .env file.

Example:
```text
REDIS_HOST=localhost
REDIS_PORT=9736
REDIS_PASSWORD=
```

Run the following command.

```sh
pnpm start:dev
```

### Step 3

Make a `POST` request to `http://localhost:5500/v1/projects` with the required payload to create a new project.

Check the console of rahat deployment worker to confirm that the project container has started.

You are now all set to develop Rahat using a containerized environment with hot-reloading enabled.

