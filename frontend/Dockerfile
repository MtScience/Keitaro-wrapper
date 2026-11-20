# Этап 1: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm ci

COPY . .

# Переменная окружения передается на этапе сборки Vite/CRA
ARG VITE_API_BASE=http://localhost:8000/api
ENV VITE_API_BASE=$VITE_API_BASE
ENV REACT_APP_API_BASE=$VITE_API_BASE

RUN npm run build

# Этап 2: Раздача статики через Nginx
FROM nginx:alpine

# ВНИМАНИЕ: Если используете Create React App вместо Vite, замените /app/dist на /app/build
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
