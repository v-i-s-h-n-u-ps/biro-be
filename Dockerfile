# -----------------------
# Production Dockerfile
# -----------------------

# Base image (Debian variant for nvm compatibility)
FROM node:22-bullseye-slim AS base

# Set working directory
WORKDIR /usr/src/app

# Install curl (needed for nvm)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install nvm and Node version from .nvmrc
COPY .nvmrc ./
ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=$(cat .nvmrc)
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm use $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && ln -s $NVM_DIR/versions/node/v$NODE_VERSION/bin/node /usr/local/bin/node \
    && ln -s $NVM_DIR/versions/node/v$NODE_VERSION/bin/npm /usr/local/bin/npm \
    && ln -s $NVM_DIR/versions/node/v$NODE_VERSION/bin/npx /usr/local/bin/npx

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]
