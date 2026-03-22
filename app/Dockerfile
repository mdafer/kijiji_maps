FROM node:24-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && apk del python3 make g++

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8082
ENTRYPOINT ["docker-entrypoint.sh"]
CMD [ "node", "index.js" ]
