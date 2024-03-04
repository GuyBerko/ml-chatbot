FROM python:3.8-slim-buster

WORKDIR /app
COPY requirements.txt requirements.txt
RUN --mount=type=cache,target=/root/.cache pip --default-timeout=1000 install -r requirements.txt
COPY . .

CMD [ "python3", "-u", "src/server.py", "serve"]