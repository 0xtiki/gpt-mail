#!/bin/bash

# 1. Set NODE_ENV environment variable to 'dev'
export NODE_ENV=qa
echo "NODE_ENV set to 'qa'"

# 2. Run 'nest build' command for the specified projects
projects_to_build=("dtos" "types" "core" "inbox" "outbox" "gpt")
for project in "${projects_to_build[@]}"; do
  echo "Building project: $project"
  nest build $project
done

# 3. Run 'nest start --watch' command for the specified projects and echo PIDs
projects_to_watch=("core" "inbox" "outbox" "gpt") # "outbox" "gpt"
for project in "${projects_to_watch[@]}"; do
  echo "Starting project with watch: $project"
  nest start --watch $project &
  PID=$!
  echo "Started $project with PID: $PID"
done

# Wait for all background processes to finish
wait

echo "All projects have been started with watch."