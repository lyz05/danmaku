FROM node:14.21.0-alpine3.16

LABEL fly_launch_runtime="nodejs"
COPY . /app
WORKDIR /app

RUN npm install
ENV NODE_ENV production

CMD [ "npm", "run", "start" ]
