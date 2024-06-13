#!/bin/bash

# Get a list of all running container IDs
container_ids=$(docker ps -q)

# Print header
echo -e "NAMES\t\tPORTS\t\t\tNODE_ENV"

# Iterate over each container ID
for container_id in $container_ids; do
  # Get the container name
  container_name=$(docker inspect --format='{{.Name}}' $container_id | sed 's/\///')
  
  # Get the exposed ports
  container_ports=$(docker inspect --format='{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}}{{"\n"}}{{end}}' $container_id)

  # Get the NODE_ENV environment variable
  node_env=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' $container_id | grep 'NODE_ENV' | cut -d '=' -f2)
  
  # Print the container information
  echo -e "$container_name\t$container_ports\t$node_env"
done