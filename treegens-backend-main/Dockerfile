FROM node:22-alpine AS base

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN apk update && apk add --no-cache curl openssl yarn
RUN yarn install --frozen-lockfile

COPY . .

# Build TypeScript to dist
RUN yarn build

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 \
  && chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 5000

# Run migrations then start compiled server
ENTRYPOINT ["sh", "-c", "yarn migrate && yarn start"]