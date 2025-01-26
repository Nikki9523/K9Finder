FROM node:22

WORKDIR /app

COPY package.json ./

COPY package-lock.json ./

RUN npm install

COPY . .

FROM nginx:alpine

COPY ./dist/k9-finder/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
