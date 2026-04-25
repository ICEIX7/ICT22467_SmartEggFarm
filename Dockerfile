FROM node:20-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./dist

EXPOSE 5000

CMD ["node", "server.js"]