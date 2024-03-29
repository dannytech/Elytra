# initial stage to install dependencies
FROM node:lts

COPY package.json package-lock.json ./

# install production dependencies
RUN ["npm", "install", "--omit=dev"]

# final build stage
FROM node:lts

# minimal app directory
WORKDIR /app

# copy files
COPY --from=0 node_modules/ ./node_modules/
COPY dist/ .env.schema ./

# set the node environment, used by things like logging
ENV NODE_ENV=production

# standard server port for documentation purposes
EXPOSE 25565/tcp
EXPOSE 25575/tcp

# run the entrypoint
CMD ["node", "index.js"]
