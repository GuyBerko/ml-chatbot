FROM nikolaik/python-nodejs:python3.10-nodejs16 as base

WORKDIR /app

RUN apt-get update -y
RUN apt-get install -y libmediainfo-dev
RUN apt install -y ffmpeg
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY package.json .
RUN npm install --only=prod
COPY . .

CMD ["npm", "start"]