FROM gcr.io/deeplearning-platform-release/pytorch-gpu.1-11

WORKDIR /app
COPY requirements.txt requirements.txt

RUN pip --default-timeout=1000 install parlai
RUN pip --default-timeout=1000 install -r requirements.txt

COPY . .

RUN python3 -u src/initModel.py

CMD [ "python3", "-u", "src/server.py"]
