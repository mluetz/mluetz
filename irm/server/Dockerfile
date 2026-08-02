# REUTIB IRM-Server V1.10 — Container-Bereitstellung
# Build:  docker build -t reutib-irm ./irm/server  (aus dem Repo-Root; kopiert auch ../index.html)
#         Hinweis: wegen des Zugriffs auf ../index.html aus dem Repo-Root bauen:
#         docker build -t reutib-irm -f irm/server/Dockerfile irm
# Run:    docker run -d -p 8010:8010 -e IRM_TOKEN=geheim -v irm-data:/data reutib-irm
FROM node:22-alpine
WORKDIR /app
COPY index.html /app/index.html
COPY server/server.js /app/server/server.js
ENV PORT=8010 IRM_DB=/data/irm.db
VOLUME ["/data"]
EXPOSE 8010
CMD ["node", "/app/server/server.js"]
