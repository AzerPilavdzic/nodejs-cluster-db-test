FROM node:20-alpine

WORKDIR /app

# Install only production deps
COPY package.json ./
RUN npm i --omit=dev

# Copy source
COPY src ./src

CMD ["npm", "start"]
