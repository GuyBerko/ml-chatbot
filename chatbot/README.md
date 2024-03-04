# conversational_ai

## setup

    conda create --name polyglot pip
    conda activate polyglot
    conda install pytorch torchvision torchaudio cudatoolkit=11.3 -c pytorch # ONLY FOR A6000
    pip install -r requirements.txt
    conda install -c conda-forge libmediainfo # sometimes is needed as well
    conda install -c cyclus java-jre # sometimes is needed as well
    
    # TODO: unite setup into a single env conda file.

## interactive demo
    
### run search server

    python src/search_server.py serve --host 0.0.0.0:8080
    
### run 2.0 model with 3B params

    python ParlAI/parlai/scripts/interactive.py -t blended_skill_talk -mf zoo:blenderbot2/blenderbot2_3B/model --search_server 0.0.0.0:8080
    
### run 2.0 model with 400M params

    python ParlAI/parlai/scripts/interactive.py -t blended_skill_talk -mf zoo:blenderbot2/blenderbot2_400M/model --search_server 0.0.0.0:8080

### run telegram bot

Without grammar correction:

    python src/TelegramBot.py
    
With grammar correction:

    python src/TelegramBot.py --use-correction