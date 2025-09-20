FROM node:18-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./
RUN npm install && npm ls hardhat

COPY . .

EXPOSE 8545

CMD ["npx", "hardhat", "node"]