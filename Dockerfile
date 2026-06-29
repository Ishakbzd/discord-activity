FROM node:20-alpine AS frontend-build
ARG VITE_DISCORD_CLIENT_ID
ARG VITE_API_URL
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY shared/ ./shared/
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci
COPY shared/ ./shared/
COPY backend/ ./backend/
RUN cd backend && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV FRONTEND_DIST_PATH=/app/public
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=frontend-build /app/frontend/dist ./public
COPY backend/package.json ./
EXPOSE 3001
CMD ["node", "dist/server.js"]
