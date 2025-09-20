FROM node:18-alpine

WORKDIR /app

# Install dependencies for compute simulation
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    linux-headers \
    git

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]