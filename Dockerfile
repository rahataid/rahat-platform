FROM node:18-alpine3.17 AS builder
RUN apk add --update bash git
WORKDIR /opt/app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
# Generate Prisma client
RUN npx prisma generate
RUN yarn build

# Final Image
FROM node:18-alpine3.17
RUN apk add --update bash git
WORKDIR /usr/src/app
COPY --from=builder /opt/app/dist ./dist/
COPY --from=builder /opt/app/node_modules ./node_modules/
COPY --from=builder /opt/app/package.json ./package.json
COPY --from=builder /opt/app/prisma ./prisma/
CMD [ "node", "dist/src/main.js" ]