# Rahat Core and Projects Deployment Guide

This document outlines the steps required to deploy **Rahat Core** and associated **Rahat Projects** after server setup.

---

## Rahat Core Deployment Steps

1. **Update the User Seed Script:**

   - Modify the `seed.user.ts` script to include project-specific details such as user names and credentials.

2. **Configure Environment Variables:**

   - Update the `.env` file with the appropriate server setup details.
   - Ensure the database IP is exposed and accessible.

3. **Seed User Data:**

   - Run the `seed.user.ts` script to add users to the system.

4. **Seed Dashboard Statistics:**

   - Execute the relevant script to populate data sources for the core and project dashboard.

5. **Add SMTP Credentials:**

   - Use Swagger to call the `settings` POST API.
   - Add SMTP credentials required for email services.

6. **Add New Project Details:**

   - Call the `project` POST API to add the new project.
   - Retrieve the UUID of the new project and update it in the `.env` file.

7. **Sync Server Credentials:**

   - Update the `tools/scripts/production-setup/.env.setup` file with the server-side `.env` credentials.

8. **Deploy Rahat Core Contracts:**

   - Run the `_setup-deployment.ts` script to deploy Rahat Core contracts.
   - Deployed contracts are saved in the `production-setup/deployments` folder.

9. **Update Database with Deployed Contracts:**

   - Execute the `update-deployment.ts` script to save the deployed contracts and blockchain network information in the database.

10. **Set Forwarder Address:**

    - Update the `ERC2771_FORWARDER_ADDRESS` in the environment variables with the address of the newly deployed `ERC2771Forwarder` contract.

11. **Update the communication settings:**
    - Update the `URL` and `APP_ID` value in the seed.communication-settings.
    - Run the seed.communication-settings to add the communication settings.

---

## Rahat Projects Deployment Steps

1. **Update Environment Files:**

   - Modify the `.env` and `tools/project-scripts/production-setup/.env.setup` files to reflect the project server settings.

2. **Deploy Project-Specific Contracts:**

   - Run the `_setup-deployment.ts` script to deploy contracts for the specific project.

3. **Update Graph Network Configuration:**

   - Edit the `apps/graph/networks.json` file in the project repository to include the blockchain network details.

4. **Generate and Build Graph Code:**

   - Run the following commands:
     ```bash
     pnpm graph:codegen
     pnpm graph:build
     ```

5. **Authorize Graph Deployment:**

   - Authenticate with The Graph Studio using:
     ```bash
     graph auth --studio <deployment_key>
     ```

6. **Deploy the Subgraph:**

   - Use the deployment script defined in `package.json` to deploy the subgraph for the specified network.

7. **Update Subgraph Endpoints:**

   - Add the subgraph endpoint details to the `project_id.json` file in the `deployments` folder.
   - Use the following format:
     ```json
     "subgraphUrl": {
       "url": "https://api.studio.thegraph.com/query/<project_id>/<project_name>/version/latest"
     }
     ```

8. **Update Database with Contracts and Settings:**

   - Execute the `update-deployment.ts` script to update the project database with the deployed contracts and blockchain configurations.

9. **Run Project Specific Scripts:**
   - If there are any project specific scripts execute those scripts as per details mentioned in project Readme .

---

By following these steps, you can successfully deploy Rahat Core and its projects while ensuring synchronization across environments.
