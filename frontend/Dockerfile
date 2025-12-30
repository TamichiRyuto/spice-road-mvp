FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments for environment variables
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_API_URL

# Create .env file for Vite build and verify
RUN printf "VITE_GOOGLE_MAPS_API_KEY=%s\nVITE_API_URL=%s\n" "$VITE_GOOGLE_MAPS_API_KEY" "$VITE_API_URL" > .env && \
    echo "DEBUG: .env file created" && \
    cat .env && \
    echo "DEBUG: End of .env file"

# Build the app
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]