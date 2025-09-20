FROM node:18-alpine

WORKDIR /app

# Install dependencies for compute simulation
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    linux-headers

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]