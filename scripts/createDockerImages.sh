#!/bin/bash

# Function to read GCP_PROJECT_ID and GCP_REGION from .env.terraform file
read_env_file() {
  export $(grep -v '^#' .env.terraform | xargs)
}

# Check for the '-local' argument
LOCAL=false
if [[ "$1" == "-local" ]]; then
  LOCAL=true
fi

# Step 1: Get the npm version from package.json as NPM_PACKAGE_VERSION
NPM_PACKAGE_VERSION=$(jq -r '.version' package.json)

# Step 2: Read GCP_PROJECT_ID and GCP_REGION from .env.terraform file if -local is provided
if $LOCAL; then
  echo "Reading environment variables from .env.terraform"
  read_env_file
fi

# Check if GCP_PROJECT_ID and GCP_REGION are set
if [[ -z "$GCP_PROJECT_ID" || -z "$GCP_REGION" ]]; then
  echo "GCP_PROJECT_ID or GCP_REGION is not set"
  exit 1
fi

# Step 3: For each app <APP_NAME> (as found in nest-cli.json)
APPS=$(jq -r '.projects | to_entries[] | select(.value.type == "application") | .key' nest-cli.json)


for APP_NAME in $APPS; do
  DOCKER_IMAGE_TAG="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/gpt-mail-docker-repo/gpt-mail-${APP_NAME}-image:v${NPM_PACKAGE_VERSION}"
  
  echo "Building Docker image for app: $APP_NAME"
  docker build -f apps/$APP_NAME/Dockerfile -t $DOCKER_IMAGE_TAG .

  # Step 4: Push the Docker image to the registry
  echo "Pushing Docker image for app: $APP_NAME"
  docker push $DOCKER_IMAGE_TAG
done