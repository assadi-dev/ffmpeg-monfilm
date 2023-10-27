FROM node:20-alpine
ENV NODE_ENV=production

COPY . /var/www/app

WORKDIR /var/www/app

RUN npm install --production

EXPOSE 80

CMD node index