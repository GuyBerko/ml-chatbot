import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")


def lower_case_first_letter(test_str):
    return test_str[:1].lower() + test_str[1:] if test_str else ''


def get_gpt_response(prompt, user, model='text-curie-001', prev_response=None, lang='en', nn=3):
    print('[get_gpt_response] model used: {}'.format(model))

    if lang == 'es':
        stop = ["Estudiante:", "Lingos:"]
    else:
        stop = ["Student:", "Lingos:"]

    responses = openai.Completion.create(
        # model="text-curie-001",  # second-biggest model
        # model="text-davinci-002",  # big expensive model
        model=model,
        prompt=prompt,
        temperature=1.0,
        max_tokens=60,
        top_p=1,
        frequency_penalty=2.0,
        presence_penalty=2.0,
        stop=stop,
        user=user,
        n=nn
    )

    # extract first choice
    response = responses['choices'][0]['text'].strip()

    print('Total tokens: {}'.format(responses['usage']['total_tokens']))
    print('Prompt tokens: {}'.format(responses['usage']['prompt_tokens']))
    print('-' * 30)
    print('original response: {}'.format(response.encode("unicode_escape").decode("utf-8")))
    # print('previous response: {}'.format(prev_response.encode("unicode_escape").decode("utf-8")))
    print('-' * 30)

    if '?' not in response or response == prev_response:
        for idx, response_i in enumerate(responses['choices']):
            response_i_text = response_i['text'].strip()
            print('response #{}: {}'.format(idx + 1, response_i_text))

            if response_i_text != prev_response:
                # take the first alternative if it's different from previous response
                # but keep iterating over the loop to search for responses with questions
                # that are also different from previous response
                if response == prev_response:
                    response = response_i_text
                    # print('alternative response: {}'.format(response))

                # take the first alternative with question if different from original response and break
                if '?' in response_i_text:
                    response = response_i_text
                    # print('alternative response: {}'.format(response))
                    break

    return response


def preprocess_gpt_prompt(events, lang='en', max_sentences=30, lingos_prompt=True):
    """
    Get last max_sentences from history and pre-process a prompt string for GPT
    Ignores messages that came before last action "action_greet_new_user"
    """
    if lang == 'es':
        prefix = "A continuación se muestra una conversación entre Lingos, el tutor de español de AI, y un estudiante.\n"
        student_pre = 'Estudiante: '
        lingos_pre = 'Lingos: '
    else:  # default is English
        prefix = "Below is a conversation between Lingos the AI English tutor and a student.\n"
        student_pre = 'Student: '
        lingos_pre = 'Lingos: '
    suffix = lingos_pre[:-1] if lingos_prompt else student_pre[:-1]
    history = []
    prev_response = None

    # extract last max_sentences (user and bot)
    for idx in range(len(events) - 1, -1, -1):
        item = events[idx]

        if item['event'] == 'user' and item["text"] is not None:
            history.append(student_pre + item["text"].strip())
        elif item['event'] == 'bot' and item["text"] is not None:
            if prev_response is None:  # the first one is actually the bot's last response
                prev_response = item["text"].strip()
            history.append(lingos_pre + item["text"].strip())
        elif item['event'] == 'action' and \
                (item['name'] == 'action_greet_new_user' or
                 item['name'] == 'action_change_topic_and_ignore_history' or
                 item['name'] == 'action_change_language'):
            break

        if len(history) >= max_sentences:
            break

    # prepare GPT prompt: 1) add prefix 2) arrange sentences in the right order 3) add suffix
    prompt = prefix + "\n".join(history[::-1]) + "\n" + suffix
    num_interactions = len(history) / 2

    # Debug
    print(prompt)
    print('-' * 30)
    print('#sentences: {}, estimated #tokens: {:.0f}'.format(len(history), len(prompt.split()) / 0.75 / 0.75))
    # print('num_interactions: {}'.format(num_interactions))

    return prompt, num_interactions, prev_response


def content_filter(generated_text):
    # get response from content-filter model
    response = openai.Completion.create(
        model="content-filter-alpha",
        prompt="<|endoftext|>" + generated_text + "\n--\nLabel:",
        temperature=0,
        max_tokens=1,
        top_p=0,
        logprobs=10
    )

    output_label = response["choices"][0]["text"]

    # This is the probability at which we evaluate that a "2" is likely real
    # vs. should be discarded as a false positive
    toxic_threshold = -0.355

    if output_label == "2":
        # If the model returns "2", return its confidence in 2 or other output-labels
        logprobs = response["choices"][0]["logprobs"]["top_logprobs"][0]

        # If the model is not sufficiently confident in "2",
        # choose the most probable of "0" or "1"
        # Guaranteed to have a confidence for 2 since this was the selected token.
        if logprobs["2"] < toxic_threshold:
            logprob_0 = logprobs.get("0", None)
            logprob_1 = logprobs.get("1", None)

            # If both "0" and "1" have probabilities, set the output label
            # to whichever is most probable
            if logprob_0 is not None and logprob_1 is not None:
                if logprob_0 >= logprob_1:
                    output_label = "0"
                else:
                    output_label = "1"
            # If only one of them is found, set output label to that one
            elif logprob_0 is not None:
                output_label = "0"
            elif logprob_1 is not None:
                output_label = "1"

            # If neither "0" or "1" are available, stick with "2"
            # by leaving output_label unchanged.

    # if the most probable token is none of "0", "1", or "2"
    # this should be set as unsafe
    if output_label not in ["0", "1", "2"]:
        output_label = "2"

    return output_label
