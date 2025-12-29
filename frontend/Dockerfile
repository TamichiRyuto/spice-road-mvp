FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build argument for Google Maps API Key
ARG VITE_GOOGLE_MAPS_API_KEY

# Create .env file for Vite build and verify
RUN printf "VITE_GOOGLE_MAPS_API_KEY=%s\n" "$VITE_GOOGLE_MAPS_API_KEY" > .env && \
    echo "DEBUG: .env file created" && \
    cat .env && \
    echo "DEBUG: End of .env file"

# Build the app
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]