FROM node:23

WORKDIR /app
COPY app/. .
COPY entrypoint.sh .

RUN ["chmod", "+x", "./entrypoint.sh"]

EXPOSE 8123

CMD ["npm", "start"]
ENTRYPOINT ["sh", "entrypoint.sh"]