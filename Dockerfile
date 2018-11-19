## TRACMAN DOCKERFILE

# Node version
FROM node:8.4.0

# Copy files into container
COPY . /tracman
WORKDIR /tracman

# Install dependencies
RUN npm install

# Bundle source
COPY . .

# Build
RUN npm run build

# Open port
EXPOSE 8080

# Run
CMD [ "npm", "start" ]
