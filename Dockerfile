FROM node:18

WORKDIR /app
COPY app/. .

RUN npm install
RUN npm install -g browserify
RUN ["chmod", "+x", "./entrypoint.sh"]

EXPOSE 8123

CMD ["npm", "start"]
ENTRYPOINT ["sh", "entrypoint.sh"]