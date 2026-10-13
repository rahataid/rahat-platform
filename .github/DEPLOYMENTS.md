# Deployment Reference

This document describes the current CI/CD workflows, branches, deployment targets, and URLs for NRCS-related Rahat applications.

> **Before deploying:** Verify the selected workflow, branch, image tag, and target environment. This document reflects the details currently provided and should be updated when workflows or infrastructure change.
>
> **Legend:** `source → target` is written in the same direction as the supplied branch notes. Confirm the exact meaning of each branch mapping against the corresponding GitHub Actions workflow.

## UI

### NRCS (Old)

- **Branch mapping:** `release/v4.0.0-nrcs` ← `release/v…`
- **CI/CD workflow:** `AA Heatwave NRCS RELEASE CI/CD CLIENT`
- **Deployment URL:** <https://rahat.nrcs.org>

### NRCS (Stellar)

- **Branch mapping:** `release/v4.0.0-nrcs` ← `release/v…`
- **CI/CD workflow:** `AA Heatwave NRCS RELEASE CI/CD CLIENT`
- **Deployment URL:** <https://rahat-response.nrcs.org/>

### NRCS Simulation

- **Branch / source:** `release/v4.0.0-nrcs` ← dry run
- **CI/CD workflow:** `AA Heatwave NRCS RELEASE CI/CD`
- **Deployment URL:** <http://nrcs-simulation.rahat.io>

### NRCS Training

- **Branch:** `release/v4.0.0-nrcs`
- **CI/CD workflow:** `all dev (nrcs-training)`
- **Deployment URL:** <https://nrcs-training.rahat.io/>

### NRCS Demo

- **Branch:** `dev`
- **CI/CD workflow:** `all dev (demo-nrcs)`
- **Deployment URL:** <https://demo-nrcs.rahat.io/>

---

## Platform

### NRCS (Old)

- **Branch mapping:** `release/v4.0.0-nrcs` ← `demo-redcross`
- **CI/CD workflow:** `AA Heatwave NRCS RELEASE CI/CD CLIENT`
- **Workflow / image label provided:** `release-v4.0.0-nrcs-client`
- **API URL:** <http://api-rahat.nrcs.org>

### NRCS Stellar

- **Branch mapping:** `release/v4.0.0-nrcs` ← `demo-redcross`
- **CI/CD workflow:** `AA Heatwave NRCS RELEASE CI/CD CLIENT`
- **Workflow / image label provided:** `release-v5.0.0-nrcs-stellar`
- **API URL:** Not provided

### NRCS Simulation

- **Branch mapping:** `release/v4.0.0-nrcs` ← `demo-redcross`
- **CI/CD workflow:** `All dev CI/CD`
- **Environment to deploy:** `release-v5.0.0-nrcs`
- **API URL as provided:** <http://api-nrcs-simulatuon.rahat.io>

> **Check:** The simulation API hostname above is preserved exactly as supplied (`simulatuon`). Confirm whether this spelling is intentional before relying on it.

---

## AA (Activity Alerts)

### NRCS

- **Branch mapping:** `release/v4.0.0-nrcs` ← `demo-redcross`
- **CI/CD workflow:** `AA Heatwave NRCS RELEASE CI/CD CLIENT`
- **Deployment URL:** Not provided

### NRCS Simulation

- **Branch mapping:** `release/v4.0.0-nrcs` ← `demo-redcross`
- **CI/CD workflow:** `AA Heatwave NRCS RELEASE CI/CD`
- **Deployment URL:** Not provided

---

## Triggers

### NRCS

- **Branch mapping:** `release/v4.0.0-nrcs` ← `demo-redcross`
- **CI/CD workflow:** `ALL DEV CI/CD`
- **Deployment URL / target:** Not provided

### NRCS Simulation

- **Branch mapping:** `release/v4.0.0-nrcs` ← `demo-redcross`
- **CI/CD workflow:** `ALL DEV CI/CD`
- **Deployment URL / target:** Not provided

---

## LiteApp

### NRCS

- **Branch mapping:** `release/v2.0.0-nrcs` ← `dev`
- **CI/CD workflow:** `NRCS RELEASE CLIENT CI/CD`
- **Deployment URL:** <http://liteapp-rahat.nrcs.org>

### NRCS Simulation

- **Branch mapping:** `release/v2.0.0-nrcs` ← `dev`
- **CI/CD workflow:** `NRCS RELEASE CI/CD`
- **Deployment URL:** <http://liteapp-nrcs-simulation.rahat.io>

---

## Vendor In-Kind (`rahat-aa-inkind-vendor-app`)

### NRCS

- **Branch mapping:** `release/v1.0.0-nrcs` ← `dev`
- **CI/CD workflow:** `ALL-IN-ONE`
- **Deployment URL:** <http://inkind-vendor-rahat.nrcs.org>

### NRCS Simulation

- **Branch:** Not provided
- **CI/CD workflow:** Not provided
- **Deployment URL:** <http://inkind-vendor-nrcs-simulation.rahat.io>

### Demo

- **Branch:** Not provided
- **CI/CD workflow:** Not provided
- **Deployment URL:** <https://inkind-demo.rahat.io/>

---

## Information to Confirm or Complete

The following details were not included in the supplied notes. Fill them in after checking the relevant workflows and deployment configuration.

- Exact branch mapping for the UI NRCS (Old) and NRCS (Stellar) workflows (`release/v…` is incomplete).
- Whether the `release-v4.0.0-nrcs-client` and `release-v5.0.0-nrcs-stellar` values are workflow names, deployment environment names, or Docker image tags.
- Platform API URL for NRCS Stellar.
- Deployment URLs or targets for AA and Triggers.
- Branch and CI/CD workflow for Vendor In-Kind Simulation and Demo.
- Exact Docker image repositories and tags pushed by each workflow.
- Target server, cluster, Compose project, or Swarm service for each deployment.
- Whether each workflow restarts services, runs database migrations, or affects shared services.
- Rollback procedure and last known-good image tag for each production deployment.

## Suggested Per-Deployment Context

For each workflow, record the following once verified:

- **Image repository:** `registry/namespace/image`
- **Image tags pushed:** e.g. branch tag and/or commit SHA
- **Environment:** staging, simulation, demo, training, or production
- **Target service:** exact service/container name
- **Public URLs:** UI, API, and related endpoints
- **Impact:** expected restart, downtime risk, migrations, and dependencies
- **Rollback:** exact previous image tag or rollback command
- **Workflow owner:** responsible team
