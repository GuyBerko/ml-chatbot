
FROM python:3.8

WORKDIR /app

COPY requirements.txt requirements.txt

RUN --mount=type=cache,target=/root/.cache pip --default-timeout=1000 install torch
RUN --mount=type=cache,target=/root/.cache pip --default-timeout=1000 install -r requirements.txt

COPY . .


CMD ["uvicorn" , "sentiment_analyzer.api:app", "--host", "0.0.0.0", "--port", "4003"]