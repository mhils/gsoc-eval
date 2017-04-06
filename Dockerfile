FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app/

# Install app dependencies
RUN yarn

VOLUME  /usr/src/app

EXPOSE 3000
CMD [ "npm", "start" ]
