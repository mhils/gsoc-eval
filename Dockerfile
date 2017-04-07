FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock /usr/src/app/
RUN yarn

COPY . /usr/src/app/

EXPOSE 3000
CMD [ "npm", "start" ]
