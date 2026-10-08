# Step 1: Build the Vite application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:alpine
# Vite outputs to the 'dist' folder by default
COPY --from=builder /app/dist /usr/share/nginx/html 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
