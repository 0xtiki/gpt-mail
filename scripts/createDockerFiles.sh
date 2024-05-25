#!/bin/bash

# Check if nest-cli.json exists
if [ ! -f "nest-cli.json" ]; then
  echo "nest-cli.json not found!"
  exit 1
fi

# Read nest-cli.json to find apps and libraries
apps=$(jq -r '.projects | to_entries[] | select(.value.type=="application") | .key' nest-cli.json)
libs=$(jq -r '.projects | to_entries[] | select(.value.type=="library") | .key' nest-cli.json)

# Initialize docker-compose.yml content
compose_file="version: '3.8'\nservices:\n"

# Initialize port counter
port_counter=3000

# Create Dockerfile for each app
for app in $apps; do
  app_dir="apps/$app"
  dockerfile_path="$app_dir/Dockerfile"

  echo "Creating Dockerfile for $app..."

  cat <<EOF > $dockerfile_path
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
EOF

  for lib in $libs; do
    echo "RUN yarn build $lib" >> $dockerfile_path
  done

  cat <<EOF >> $dockerfile_path

# Build the NestJS application
RUN yarn build $app

# Set environment variables
ENV NODE_ENV=prod

# Set the working directory to the dist directory of the application
WORKDIR /usr/src/app/dist/apps/$app

# Expose the port the app runs on
EXPOSE 3000

# Command to run the NestJS application
CMD ["node", "main"]
EOF

  # Add the service to the docker-compose.yml content
  compose_file+="  $app:\n"
  compose_file+="    build:\n"
  compose_file+="      context: .\n"
  compose_file+="      dockerfile: $dockerfile_path\n"
  compose_file+="    volumes:\n"
  compose_file+="      - .:/usr/src/app\n"
  compose_file+="      - /usr/src/app/node_modules\n"
  compose_file+="    ports:\n"
  compose_file+="      - \"$port_counter:3000\"\n"
  compose_file+="    environment:\n"
  compose_file+="      - NODE_ENV=qa\n"
  compose_file+="    env_file:\n"
  compose_file+="      - .env\n"

  # Increment the port counter for the next app
  port_counter=$((port_counter + 1))
done

# Read the original package.json
original_package_json=$(cat package.json)

# Extract the scripts section
scripts=$(echo "$original_package_json" | jq '.scripts')

# Create new scripts for each app
for app in $apps; do
  dev_script="start:dev:$app"
  prod_script="start:prod:$app"
  scripts=$(echo "$scripts" | jq --arg dev_script "$dev_script" --arg prod_script "$prod_script" \
    --arg dev_command "nest start $app --watch" --arg prod_command "node dist/apps/$app/main" \
    '. + {($dev_script): $dev_command, ($prod_script): $prod_command}')
done

# Create the updated package.json with new scripts
updated_package_json=$(echo "$original_package_json" | jq --argjson scripts "$scripts" '.scripts = $scripts')

# Save the updated package.json to package-updated.json
echo "$updated_package_json" > package-updated.json

# Save the docker-compose.yml content to a file
echo -e "$compose_file" > docker-compose.yml

echo "Dockerfiles created, docker-compose.yml generated, and package-updated.json generated."