# Deploy BERT for Sentiment Analsysis with FastAPI

Deploy a pre-trained BERT model for Sentiment Analysis as a REST API using FastAPI

## Demo

The model is trained to classify sentiment (negative, neutral, and positive) on a custom dataset from app reviews on Google Play. Here's a sample request to the API:

```bash
http POST http://127.0.0.1:8000/predict text="Good basic lists, i would like to create more lists, but the annual fee for unlimited lists is too out there"
```

The response you'll get looks something like this:

```js
{
    "confidence": 0.9999083280563354,
    "probabilities": {
        "negative": 3.563107020454481e-05,
        "neutral": 0.9999083280563354,
        "positive": 5.596495248028077e-05
    },
    "sentiment": "neutral"
}
```

You can also [read the complete tutorial here](https://www.curiousily.com/posts/deploy-bert-for-sentiment-analysis-as-rest-api-using-pytorch-transformers-by-hugging-face-and-fastapi/)

## Installation

Clone this repo:

```sh
git clone git@github.com:EliSchwartz/Sentiment-Analysis-Server.git
cd Sentiment-Analysis-Server
```

Install the dependencies:

```sh
pip install pipenv
pipenv install --dev
```

Download the pre-trained model:

```sh
bin/download_model
```
If download fails manually locate "https://drive.google.com/uc?id=1V8itWtowCYnb2Bc9KlK9SxGff9WwmogA" in "assets/model_state_dict.bin"

## Test the setup

Start the HTTP server:

With GPU
```sh
CUDA_VISIBLE_DEVICES=0 bin/start_server
```
Without GPU
```sh
CUDA_VISIBLE_DEVICES='' bin/start_server
```

Send a test request:

```sh
bin/test_request
```

or
```http POST http://localhost:8000/predict text="This app is a total waste of time!"```

## License

MIT
