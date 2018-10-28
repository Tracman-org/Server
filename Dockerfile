## TRACMAN DOCKERFILE

# Node version
FROM node:8.4.0

# Install tracman from Github
RUN git clone https://github.com/Tracman-Org/Server.git /tracman
WORKDIR /tracman

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Bundle source
COPY . .

# Build
RUN npm run build

# Open port
EXPOSE 8080

# Run
CMD [ "npm", "start" ]
