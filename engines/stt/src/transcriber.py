import os
import json
import logging
import torch
import torchaudio
from pydub import AudioSegment
from df.enhance import init_df, enhance
from pydub.silence import split_on_silence
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
generate_kwargs = {
    "return_timestamps": True,
    "num_beams": 1,
    "condition_on_prev_tokens": False,
    "compression_ratio_threshold": 1.35,  # zlib compression ratio threshold (in token space)
    "temperature": (0.0, 0.2, 0.4, 0.6, 0.8, 1.0),
    "logprob_threshold": -1.0,
    "no_speech_threshold": 0.6
}

class AudioTranscriber:
    """Handles model loading and transcription."""
    def __init__(self, chunk_length):
        self.chunk_length = chunk_length
        # Set device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        # Load model and processor
        
        self.model = AutoModelForSpeechSeq2Seq.from_pretrained(
            "openai/whisper-large-v3", torch_dtype=self.torch_dtype, low_cpu_mem_usage=True, cache_dir="./models"
        ).to(self.device)

        self.processor = AutoProcessor.from_pretrained("openai/whisper-large-v3", cache_dir="./models")

        # Initialize pipeline
        self.pipe = pipeline(
            "automatic-speech-recognition",
            model=self.model,
            tokenizer=self.processor.tokenizer,
            feature_extractor=self.processor.feature_extractor,
            chunk_length_s=self.chunk_length,
            batch_size=16,
            torch_dtype=self.torch_dtype,
            device=self.device,
        )

    def transcribe(self, audio_data):
        """
        Transcribes audio data using the model.
        Args:
            audio_data (dict): Audio data with 'array' and 'sampling_rate'.
            audio_name (str): Name of the audio file for saving the transcription.
            enhanced (bool): Whether the audio was enhanced.
        Returns:
            str: Transcription text.
        """
        # Add language and task to generate_kwargs
        generate_kwargs.update({
            "language": "pashto",  # Specify the language for transcription
            "task": "transcribe",
        })
        result = self.pipe(audio_data, generate_kwargs=generate_kwargs)
        print(f"Transcription result: {result}")
        logging.info(f"Transcription result: {result}")
        transcription = result["text"]
        return transcription
    
    def translate(self, audio_data, target_language="en"):
        """
        Translates audio data to the target language using the model.
        Args:
            audio_data (dict): Audio data with 'array' and 'sampling_rate'.
            target_language (str): Language code to translate to (default: "en").
        Returns:
            str: Translated text.
        """
        generate_kwargs.update({
            "language": target_language,  # Specify the language for transcription
            "task": "translate",
        })
        result = self.pipe(audio_data, generate_kwargs=generate_kwargs)
        print(f"Translation result: {result}")
        logging.info(f"Translation result: {result}")
        translation = result["text"]
        return translation
    
