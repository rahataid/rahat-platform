FROM node:18-alpine3.17 AS builder
RUN apk add --update bash git
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Generate Prisma client
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine3.17 AS deps
RUN apk add --update bash git
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install --omit=dev && npm cache clean --force

# Final Image
FROM node:18-alpine3.17
RUN apk add --update bash git
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=builder /opt/app/dist ./dist/
COPY --chown=node:node --from=deps /opt/app/node_modules ./node_modules/
COPY --chown=node:node --from=builder /opt/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --chown=node:node --from=builder /opt/app/package.json ./package.json
COPY --chown=node:node --from=builder /opt/app/prisma ./prisma/
CMD [ "node", "dist/src/main.js" ]