# initial stage to install dependencies
FROM node:lts

COPY package.json package-lock.json .

# install production dependencies
RUN ["npm", "install", "--production"]

# final build stage
FROM node:lts

# minimal app directory
WORKDIR /app

# copy files
COPY --from=0 node_modules/
COPY dist/* .

# standard server port for documentation purposes
EXPOSE 25565/tcp

# run the entrypoint
CMD ["node", "index.js"]
