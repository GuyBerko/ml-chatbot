#!/usr/bin/python
# -*- coding: utf-8 -*-
from pymediainfo import MediaInfo
import sys
import json
import subprocess
RESAMPLE_RATE = 48000
SUPPORTED_SAMPLE_RATES = [8000, 12000, 16000, 24000, 48000]


def __resample(file_name):
    new_file_name = file_name + ".raw"

    cmd = ["ffmpeg", "-loglevel", "quiet", "-i", file_name, "-f", "s16le",
           "-acodec", "pcm_s16le", "-ar", str(RESAMPLE_RATE), new_file_name]

    try:
        subprocess.run(args=cmd)
    except Exception as e:
        raise e

    return 1, new_file_name, RESAMPLE_RATE


if __name__ == '__main__':
    try:
        path = sys.argv[1]

        if not path:
            raise Exception('no file path')

        media_info = MediaInfo.parse(path)

        if len(media_info.audio_tracks) != 1 or not hasattr(media_info.audio_tracks[0], "sampling_rate"):
            raise Exception(
                "Failed to detect sample rate. media_info: {}".format(media_info))

        sample_rate = media_info.audio_tracks[0].sampling_rate

        if sample_rate not in SUPPORTED_SAMPLE_RATES:
            encoding, file_name, sample_rate = __resample(path)
            res = {
                'encoding': encoding,
                'filePath': file_name,
                'sampleRate': sample_rate
            }

            print(json.dumps(res))
        else:
            res = {
                'filePath': path,
                'sampleRate': sample_rate
            }

            print(json.dumps(res))
    except Exception as e:
        error = {
            'error': str(e)
        }
        print(json.dumps(error))
    finally:
        sys.stdout.flush()
