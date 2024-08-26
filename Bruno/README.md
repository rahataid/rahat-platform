## Bruno Overview

- Bruno is a Fast and Git-Friendly Opensource API client, aimed at revolutionizing the status quo represented by Postman, Insomnia and similar tools out there.

### Bruno CLI

- Installation

```
npm install -g @usebruno/cli
```

### Steps to follow for running Bruno Test Files

1. Bootstrap Rahat Core Services

This step writes all the scrips, seed files and dependencies and runs all necessary services in Docker.

```
pnpm bootstrap
```

2. Run the Rahat Project

Go through the following link for running required services: [here](https://github.com/rahataid/rahat-platform-nx/blob/main/README.md)

3. Run the Bruno script

```
pnpm run bruno:test
```

### Description of key components

- dev-tools/: Configuration files and scripts for setting up development tools using Docker Compose.

    - .env.example: Example environment variables file.

    - .env: Environment variables file.

### Description of env variables

1. URL

This URL points to version 1 of an API running on a local server, accessible on port 5500.

```
http: The protocol used to access the URL (in this case, HTTP).

localhost: The hostname or domain name of the server (in this case, the local machine).

5500: The port number used to access the server (a non-standard port, not the default HTTP port 80).

v1: The path or endpoint on the server, indicating version 1 of an API (Application Programming Interface).
```
2. USER_EMAIL

```
This field holds the manager's email address, granting permission to perform Create, Read, Update, and Delete (CRUD) operations on all endpoints.
```
3. PRIVATE_KEY

```
This field holds the private key for the managers email address, used for authentication and authorization purposes.
```
