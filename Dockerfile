FROM node:14.21.0-alpine3.16
ENV TZ Asia/Shanghai

RUN apk add tzdata && cp /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo ${TZ} > /etc/timezone \
    && apk del tzdata


LABEL fly_launch_runtime="nodejs"
COPY . /app
WORKDIR /app

RUN npm install
ENV NODE_ENV production

CMD [ "npm", "run", "start" ]
