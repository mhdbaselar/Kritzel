FROM node:21

WORKDIR /app# Copy package files first to install dependencies
COPY app/package*.json ./

# Install dependencies globally and locally
RUN npm install && npm install -g nodemon browserify watchify

# Copy the rest of the application code and entrypoint script
COPY app/. .
COPY entrypoint.sh /scripts/entrypoint.sh

# Make entrypoint executable
RUN chmod +x /scripts/entrypoint.sh

EXPOSE 8123

# Set entrypoint and cmd
ENTRYPOINT ["/scripts/entrypoint.sh"]
CMD ["nodemon", "./kritzel.js"]