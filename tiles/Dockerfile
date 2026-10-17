FROM caddy:2.11-alpine

ENV PORT=8080
ENV TILES_UPSTREAM=tiles-archive:8080
ENV SRV_ROOT=/srv

COPY dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080
