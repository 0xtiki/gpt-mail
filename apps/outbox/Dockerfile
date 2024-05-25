# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the Yarn configuration files and monorepo configuration files
COPY package.json yarn.lock tsconfig.json nest-cli.json ./

# Copy the source code for the entire monorepo
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Build all libraries
RUN yarn build dtos
RUN yarn build types
RUN yarn build config

# Build the NestJS application
RUN yarn build outbox

# Set environment variables
ENV NODE_ENV=prod

# Set the working directory to the dist directory of the application
WORKDIR /usr/src/app/dist/apps/outbox

# Expose the port the app runs on
EXPOSE 3000

# Command to run the NestJS application
CMD ["node", "main"]
