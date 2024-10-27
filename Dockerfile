FROM node:18

WORKDIR /app
COPY app/. .

RUN npm install
RUN ["chmod", "+x", "./entrypoint.sh"]

EXPOSE 8123

CMD ["npm", "start"]
ENTRYPOINT ["sh", "app/entrypoint.sh"]