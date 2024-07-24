# Define node version
FROM node:alpine as build

ARG env=prod

# Define container directory
WORKDIR /usr/src/app
# Copy files to virtual directory
# COPY package.json package-lock.json ./
# Install dependencies first, as they change less often than code.
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force
# Copy files from local machine to virtual directory in docker image
COPY . .
RUN npm run build:$env


### STAGE 2:RUN ###
# Defining nginx image to be used
FROM nginx:alpine AS ngi
# Copying compiled code and nginx config to different folder
# NOTE: This path may change according to your project's output folder
COPY --from=build /usr/src/app/dist/trendlensbackend /usr/share/nginx/html
COPY /nginx.conf  /etc/nginx/conf.d/default.conf
# Exposing a port, here it means that inside the container
# the app will be using Port 80 while running
EXPOSE 80
