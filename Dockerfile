# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies based on lock file
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Set default port
ENV PORT=80

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config as a template
# The nginx image will automatically run envsubst on files in this directory
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]
