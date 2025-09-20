FROM node:18-alpine

WORKDIR /app

# Install basic dependencies (remove complex packages to avoid network issues)
RUN apk add --no-cache git || echo "Git installation failed - continuing without"

COPY package*.json ./
RUN npm install

COPY . .

# Build the TypeScript code
RUN npm run build

EXPOSE 3002

# Run in production mode
CMD ["npm", "start"]