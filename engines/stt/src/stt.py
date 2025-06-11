import os
import json
import logging
import torch
import torchaudio
import re
from pydub import AudioSegment
from df.enhance import init_df, enhance
from pydub.silence import split_on_silence
from pydub.silence import detect_nonsilent
import subprocess

MIN_CHUNK_SIZE = 10_000

class AudioPreprocessor:
    """
    Handles audio loading, noise suppression, saving enhanced audio, and chunking.
    """
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logging.info(f"Using device: {self.device}")

        # Initialize DeepFilterNet
        self.model, self.df_state, _ = init_df()
        self.model.to(self.device)
        logging.info("DeepFilterNet initialized successfully.")

    def load_and_preprocess_audio(self, audio_path, enhanced_path, isEnhanced=True):
        """
        Load the audio file, optionally apply noise suppression, and save the enhanced audio.
        If isEnhanced is False, just copy/save the file as-is to enhanced_path.
        """
        logging.info(f"Loading audio file: {audio_path}")

        if not isEnhanced:
            # Just copy the file as-is to enhanced_path
            logging.info("isEnhanced is False. Saving audio without enhancement.")
            audio = AudioSegment.from_file(audio_path)
            audio.export(enhanced_path, format="wav")
            logging.info(f"Audio saved to: {enhanced_path}")
            return enhanced_path

        # Otherwise, apply enhancement
        waveform, sample_rate = torchaudio.load(audio_path)

        # Convert to mono if multiple channels exist
        if waveform.size(0) > 1:
            logging.info("Converting audio to mono.")
            waveform = torch.mean(waveform, dim=0, keepdim=True)

        # Apply noise suppression
        logging.info("Enhancing audio with DeepFilterNet.")
        with torch.no_grad():
            waveform = enhance(self.model, self.df_state, waveform.cpu(), pad=True)
        logging.info("Audio enhanced successfully.")

        # Save enhanced audio
        torchaudio.save(enhanced_path, waveform.cpu(), sample_rate)
        logging.info(f"Enhanced audio saved to: {enhanced_path}")

        return enhanced_path

    def save_chunks(self, filepath, silence_thresh=-35, min_silence_len=500, min_chunk_length_ms=30000):
        """
        Split audio based on silence and save chunks to the generated directory.
        """
        # Extract the directory and filename from the given path
        file_dir, file_name = os.path.split(filepath)
        audio_basename = os.path.splitext(file_name)[0]

        # Create the output directory based on the filename (without extension)
        output_dir = os.path.join(file_dir, audio_basename)
        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Saving chunks to directory: {output_dir}")

        # Load the audio file
        audio = AudioSegment.from_file(filepath, format="wav")

        # Detect non-silent segments
        nonsilent_ranges = detect_nonsilent(
            audio,
            min_silence_len=min_silence_len,
            silence_thresh=silence_thresh
        )

        metadata = []
        current_start = 0
        flat_ranges = [(start, end) for start, end in nonsilent_ranges]
        
        logging.info(f"Detected {len(flat_ranges)} non-silent segments.")
        audio_length = len(audio)
        print(f"Audio length: {audio_length} ms")

        i = 0
        while current_start < audio_length:
            # Find the next silence after at least min_chunk_length_ms
            next_split = audio_length
            for start, end in flat_ranges:
                if start > current_start + min_chunk_length_ms:
                    next_split = start
                    break

            # Extract and save the chunk
            chunk = audio[current_start:next_split]
            chunk_name = f"{i + 1:04d}.wav"
            chunk_path = os.path.join(output_dir, chunk_name)
            chunk.export(chunk_path, format="wav")
            logging.info(f"Saved chunk: {chunk_path}")

            metadata.append({
                "path": chunk_path,
                "start": current_start,
                "end": next_split
            })

            current_start = next_split
            i += 1
            print(f"Current start: {current_start} ms, Next split: {next_split} ms")

        # # Save metadata to a JSON file with the same name as the audio file
        # metadata_path = os.path.join(output_dir, f"{audio_basename}.json")
        # with open(metadata_path, "w") as json_file:
        #     json.dump(metadata, json_file, indent=4)

        # logging.info(f"Metadata saved to: {metadata_path}")

        return metadata


def split_wav(filepath):
    """
    Enhance the audio and split it into chunks based on silence.
    """
    logging.info(f"Processing audio: {filepath}")
    preprocessor = AudioPreprocessor()

    # Save audio chunks
    chunks_json = preprocessor.save_chunks(filepath)
    return chunks_json


def convert_to_wav(filepath):
    """
    Convert input video file to WAV format using ffmpeg, forcing mono channel.
    The output file is saved in the same location with the same name but with a .wav extension.
    """

    # Generate WAV path by changing the file extension to '.wav'
    wav_path = os.path.splitext(filepath)[0] + ".wav"

    logging.info(f"Converting {filepath} to WAV format at {wav_path} using ffmpeg...")
    command = [
        "ffmpeg",
        "-y",  # Overwrite output file if it exists
        "-i", filepath,
        "-ac", "1",  # Force mono channel
        "-ar", "16000",
        "-sample_fmt", "s16",
        wav_path
    ]
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logging.info(f"Audio saved to: {wav_path}")
    except subprocess.CalledProcessError as e:
        logging.error(f"ffmpeg conversion failed: {e.stderr.decode()}")
        raise

    return wav_path