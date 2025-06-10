import re
import json
import torch
import os
import sys
from flask import Flask, request, jsonify
import logging
import time
import shutil

sys.path.append('/stt/src')
from stt import convert_to_wav
from stt import enhance_and_split
from stt import transcribe, translate
from stt import create_subfiles
from transcriber import AudioTranscriber

# Configure logging
logging.basicConfig(level=logging.INFO)


app = Flask(__name__)

# Transcribe the chunk
global audio_transcriber
chunk_length = 30
audio_transcriber = None #AudioTranscriber(chunk_length=chunk_length)


@app.route('/split', methods=['POST'])  # Ensure no trailing slash
def api_split():
    result = {}
    try:
        data = request.get_json()
        fileId, filepath = data['fileId'], data['filepath']

        # Step 1: Make sure the file exists
        if not os.path.exists(filepath):
            result = {
                'message': f"لم يتم العثور على الملف {filepath}",
                'result': []
            }
            return jsonify(result)

        # Convert the video to wav and mono signal (1600 sample rate)
        # wav_path = convert_to_wav(filepath)
        logging.info(f"Converted audio file to: {filepath}")
        
        # result = {
        #     'message': f'تم تجزئة المقطع الصوتي بنجاح {filepath}',
        #     'code': 200,
        #     'result': wav_path
        # }

    except Exception as e:
        logging.error(f"{e}")

        result = {
            'message': f"{e}",
            'code': 500,
            'result': []
        }

    return jsonify(result)

@app.route('/convert', methods=['POST'])  # Ensure no trailing slash
def api_convert():
    result = {}
    try:
        data = request.get_json()
        fileId, filepath = data['fileId'], data['filepath']

        # Step 1: Make sure the file exists
        if not os.path.exists(filepath):
            result = {
                'message': f"لم يتم العثور على الملف {filepath}",
                'result': []
            }
            return jsonify(result)

        # Convert the video to wav and mono signal (1600 sample rate)
        wav_path = convert_to_wav(filepath)
        logging.info(f"Converted audio file to: {wav_path}")
        
        result = {
            'message': f'تم تجزئة المقطع الصوتي بنجاح {filepath}',
            'code': 200,
            'result': wav_path
        }

    except Exception as e:
        logging.error(f"{e}")

        result = {
            'message': f"{e}",
            'code': 500,
            'result': []
        }

    return jsonify(result)

if __name__ == "__main__":
    app.run()
    logging.info("Flask app is running.")