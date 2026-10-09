# Step 1: Build the Vite application
FROM node:22-alpine AS builder

WORKDIR /app

# Production build arguments
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

# Make variables available to Vite during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build frontend
RUN npm run build

# Step 2: Serve using Nginx
FROM nginx:alpine

# Nginx configuration for React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]