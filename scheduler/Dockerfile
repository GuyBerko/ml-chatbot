FROM node:16 as base

WORKDIR /app
COPY package.json .
COPY tsconfig.json .
RUN npm install 
COPY . .

CMD ["npm", "start"]