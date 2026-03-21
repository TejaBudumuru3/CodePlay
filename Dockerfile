FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm install
RUN npm run build

CMD ["npm", "start"]
