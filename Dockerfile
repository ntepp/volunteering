# Stage 1: Build
FROM node:18-slim AS builder
WORKDIR /app

# Install build tools required to compile native Node.js modules (lmdb)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy only package.json — exclude package-lock.json (generated on Windows,
# missing Linux optional binaries for rollup/lmdb). npm resolves fresh for Linux.
COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build -- --no-prerender

# Angular 18 SSR names the CSR entry point "index.csr.html" instead of "index.html".
# Copy browser assets and rename so nginx can serve them as a standard SPA.
RUN mkdir -p /app/nginx-dist && \
    cp -a /app/dist/volunteering-ui/browser/. /app/nginx-dist/ && \
    mv /app/nginx-dist/index.csr.html /app/nginx-dist/index.html

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/nginx-dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
