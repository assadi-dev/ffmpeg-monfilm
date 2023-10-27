FROM node:latest

ENV NODE_ENV=production

#COPY --from=mwader/static-ffmpeg:6.0-1 /ffmpeg /usr/local/bin/
#COPY --from=mwader/static-ffmpeg:6.0-1 /ffprobe /usr/local/bin/

COPY . /var/www/app

WORKDIR /var/www/app

RUN npm install --production

EXPOSE 5500

CMD node index