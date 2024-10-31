FROM node:23

WORKDIR /app

# Install global dependencies
RUN npm install -g nodemon browserify

# Copy app and entrypoint script
COPY app/. .
COPY entrypoint.sh /scripts/entrypoint.sh

# Make entrypoint executable
RUN chmod +x /scripts/entrypoint.sh

EXPOSE 8123

# Set entrypoint and cmd
ENTRYPOINT ["/scripts/entrypoint.sh"]
CMD ["nodemon", "./kritzel.js"]