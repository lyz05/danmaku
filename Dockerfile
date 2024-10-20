FROM node:16.18.0-alpine
ENV TZ Asia/Shanghai

RUN apk add tzdata sqlite sqlite-dev && cp /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo ${TZ} > /etc/timezone \
    && apk del tzdata

LABEL fly_launch_runtime="nodejs"
WORKDIR /app
COPY ./package.json /app
RUN npm install --production && npm prune --production
COPY . /app
ENV NODE_ENV production

CMD [ "npm", "run", "start" ]
