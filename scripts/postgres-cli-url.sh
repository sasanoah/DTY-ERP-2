#!/usr/bin/env sh

postgres_cli_url(){
  normalized_url="$1"
  for prisma_parameter in schema connection_limit pool_timeout; do
    normalized_url="$(printf '%s' "$normalized_url" | sed -E "s/([?&])${prisma_parameter}=[^&]*(&|$)/\\1/; s/[?&]$//")"
  done
  printf '%s' "$normalized_url"
}
