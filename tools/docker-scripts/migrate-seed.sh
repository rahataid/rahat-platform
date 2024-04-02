#! /bin/sh

pnpm migrate:dev
pnpm seed
pnpm nx reset
