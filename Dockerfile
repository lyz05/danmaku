FROM node:16.18.0-alpine
ENV TZ Asia/Shanghai

RUN apk add tzdata && cp /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo ${TZ} > /etc/timezone \
    && apk del tzdata


LABEL fly_launch_runtime="nodejs"
COPY . /app
WORKDIR /app

RUN npm install --production && npm prune --production
ENV NODE_ENV production

CMD [ "npm", "run", "start" ]
