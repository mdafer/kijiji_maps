#!/bin/sh

# Docker Desktop for Windows blocks outbound UDP/53 (standard DNS) from containers.
# Resolve critical hostnames via DNS-over-HTTPS (port 443 works) and pin them in /etc/hosts.
# Chromium also gets DoH flags, but Node.js needs /etc/hosts for its own requests.

resolve_doh() {
  # Query Cloudflare DoH and extract the first IP
  wget -q -O - "https://1.1.1.1/dns-query?name=$1&type=A" \
    --header='Accept: application/dns-json' 2>/dev/null \
    | sed -n 's/.*"data":"\([0-9.]*\)".*/\1/p' | head -1
}

echo "Resolving external hostnames via DoH..."
for host in www.airbnb.com airbnb.com www.kijiji.ca kijiji.ca; do
  ip=$(resolve_doh "$host")
  if [ -n "$ip" ]; then
    echo "$ip $host" >> /etc/hosts
    echo "  $host -> $ip"
  else
    echo "  WARNING: could not resolve $host"
  fi
done

exec "$@"
