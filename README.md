# Rahat Backend - Project README

Welcome to Rahat, an open-source blockchain-based platform backend! This README provides guidelines to set up and use the Rahat backend project.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
  - [Database Seeding](#database-seeding)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Development](#development)
  - [Running in Development](#running-in-development)
  - [Building and Starting in Production](#building-and-starting-in-production)
  - [Husky - Git Hooks](#husky---git-hooks)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js and npm (or yarn)
- PostgreSQL (or your preferred database)

### Installation Steps

Clone this repository:

````bash
git clone https://github.com/rahataid/rahat-backend.git
 ```


## Installation

### Install Dependencies

```bash
yarn install
````

### Environment Variables

Create a `.env` file in the root directory and add:

```env
DATABASE_URL=your_database_url
PORT=your_port_number
```

### Database Seeding

Seed your database with initial data:

```bash
ts-node prisma/seed.ts
```

## Usage

Explain how to use your project. Provide examples, code snippets, or screenshots to demonstrate how users can interact with it. Cover common use cases and potential scenarios.

## Development

### Running in Development

Run in development mode:

```bash
yarn dev
```

### Building and Starting in Production

Build and start the server for production:

```bash
yarn build
yarn start
```

### Husky - Git Hooks

Husky enforces code quality checks before commits.

## Folder Structure

Detailed overview of the folder structure:

- `src/`
  - `modules/`
    - `users/`
      - ...
      - `entities/`
        - `user.entity.ts`
  - `utils/`
    - `utility1.ts`
    - `utility2.ts`
  - `app.module.ts`
  - `main.ts`
- `prisma/`
  - `schema.prisma`
  - `seed.ts`

Organized for clear separation of concerns.

## Contributing

Contributions are welcome! To contribute:

1. Fork this repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`.
3. Make your changes and commit: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature-name`.
5. Create a pull request.

## License

Specify the project's license.

## Contact

For questions or collaboration: team@rahat.io

```

```
