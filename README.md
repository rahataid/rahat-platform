# Rahat Platform

## Overview 

Welcome to the Rahat Platform, a monorepo designed to streamline the management and advancement of Rahat Core. Rahat is an innovative aid distribution platform powered by Blockchain Technology, aiming to revolutionize the aid distribution process.

## Getting Started

Follow the steps below to set up and run the project in a development environment:

### Prerequisites

Before you begin, ensure your system has the following dependencies installed:

- Docker:  Version 20.10.7 or higher
- Node.js: Version 20.10.0 or higher
- pnpm (Package Manager): Version 6.16.1 or higher

### Setup

1. **Clone the Repository**

    Use the following command to clone the repository:

    ```bash
    git clone git@github.com:el-rumsan/rahat-platform-nx.git
    ```

2. **Bootstrap Rahat Core Services**

    This step installs the dependencies and runs all necessary services in Docker, as well as scripts to set up the project:

    ```bash
    pnpm bootstrap
    ```

3. **Clone the Desired Project**

    Rahat currently supports the following projects:
     - [rahat-project-el](https://github.com/rahataid/rahat-project-el) 

    Clone the project you want to run and follow the instructions in its README.md file.

4. **Run the Rahat Project**

    Initiate the rahat-core by executing the following commands in separate terminals:

    ```bash
    pnpm rahat
    ```

    ```bash
    pnpm beneficiary
    ```

5. **Access API Documentation**

    You can explore the API documentation at: [http://localhost:5501/swagger](http://localhost:5501/swagger)

Explore the functionalities provided by the Rahat Platform locally. If you encounter any issues, refer to the troubleshooting section within the documentation or contact the project maintainers for assistance.