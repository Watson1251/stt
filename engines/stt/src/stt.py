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

    def save_chunks(self, enhanced_path, splits_dir, text_json_file, silence_thresh=-35, min_silence_len=500):
        """
        Split audio based on silence and save chunks to the specified directory.
        """
        os.makedirs(splits_dir, exist_ok=True)
        logging.info(f"Saving chunks to directory: {splits_dir}")

        # Load the enhanced audio
        audio = AudioSegment.from_file(enhanced_path, format="wav")

        # Detect non-silent segments
        # Detect non-silent segments, but chunk after the first silence after at least 10 seconds
        min_chunk_length_ms = MIN_CHUNK_SIZE  # 30 seconds in milliseconds
        nonsilent_ranges = detect_nonsilent(
            audio,
            min_silence_len=min_silence_len,
            silence_thresh=silence_thresh
        )

        metadata = []
        chunks = []
        current_start = 0

        # Flatten nonsilent ranges into a list of (start, end) for easier processing
        flat_ranges = []
        for start, end in nonsilent_ranges:
            flat_ranges.append((start, end))
        
        logging.info(f"Detected {len(flat_ranges)} non-silent segments.")

        i = 0
        audio_length = len(audio)
        print(f"Audio length: {audio_length} ms")
        while current_start < audio_length:
            # Find the next silence after at least 10 seconds from current_start
            next_split = None
            
            for start, end in flat_ranges:
                if start > current_start + min_chunk_length_ms:
                    next_split = start
                    break
                if next_split is None or next_split > audio_length:
                    next_split = audio_length

            chunk = audio[current_start:next_split]
            chunk_name = f"{i + 1:04d}.wav"
            chunk_path = os.path.join(splits_dir, chunk_name)
            chunk.export(chunk_path, format="wav")
            logging.info(f"Saved chunk: {chunk_path}")

            metadata.append({
            "path": chunk_path,
            "text": "",
            "trans": "",
            "start": current_start,
            "end": next_split
            })

            current_start = next_split
            i += 1
            print(f"Current start: {current_start} ms, Next split: {next_split} ms")

            

        # Save metadata to a JSON file with the same name as the audio file
        audio_basename = os.path.splitext(os.path.basename(enhanced_path))[0]
        metadata_path = os.path.join(splits_dir, f"{audio_basename}.json")
        with open(metadata_path, "w") as json_file:
            json.dump(metadata, json_file, indent=4)

        # Save another copy of the metadata to the text_json_file if it doesn't exist
        if not os.path.exists(text_json_file):
            with open(text_json_file, "w") as json_file:
                json.dump(metadata, json_file, indent=4)

        logging.info(f"Metadata saved to: {metadata_path}")

        return metadata_path


def create_subfiles(input_path, AUDIO_DIR):
    # without the extension
    basename = os.path.splitext(os.path.basename(input_path))[0]

    # target subfiles directory
    subfiles_dir = os.path.join(AUDIO_DIR, basename)

    # create directories if they don't exist
    os.makedirs(subfiles_dir, exist_ok=True)

    # create a var for audio_path
    audio_path = input_path

    # always convert to WAV
    if re.search(r'\.(mp4|avi|mov|mkv|wav)$', input_path, re.IGNORECASE):
        # check if has been converted before
        wav_path = os.path.join(AUDIO_DIR, f"{basename}.wav")
        if os.path.exists(wav_path):
            audio_path = wav_path
        else:
            audio_path = convert_to_wav(input_path, wav_path)
    
    logging.info(f"Audio path: {audio_path}")

    # check if audio longer than 10 min


# def recursive_chunk(audio_path, subfiles_dir):



def transcribe(audio_path, json_file, transcriber):
    # define a target segment
    target_segment = None
    
    chunk_waveform, chunk_sample_rate = torchaudio.load(audio_path)
    chunk_data = {"array": chunk_waveform.squeeze().cpu().numpy(), "sampling_rate": chunk_sample_rate}
    transcription = transcriber.transcribe(chunk_data)
    print("---------------------------------")
    print(f"audio_path: {audio_path}")
    # Save transcription to JSON file
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    for item in data:
        if item["path"] == audio_path:
            item["text"] = transcription
            target_segment = item
            break

    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    return target_segment

def translate(audio_path, json_file, transcriber, target_language="en"):
    # define a target segment
    target_segment = None
    
    chunk_waveform, chunk_sample_rate = torchaudio.load(audio_path)
    chunk_data = {"array": chunk_waveform.squeeze().cpu().numpy(), "sampling_rate": chunk_sample_rate}
    translation = transcriber.translate(chunk_data,target_language=target_language)
   
    # Save transcription to JSON file
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    for item in data:
        if item["path"] == audio_path:
            item["trans"] = translation
            target_segment = item
            break

    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    return target_segment

def enhance_and_split(audio_path, enhanced_path, splits_dir, text_json_file, chunk_length=None):
    """
    Enhance the audio and split it into chunks based on silence.
    """
    logging.info(f"Processing audio: {audio_path}")
    preprocessor = AudioPreprocessor()

    # Load and preprocess audio
    enhanced_path = preprocessor.load_and_preprocess_audio(audio_path, enhanced_path)

    # Save audio chunks
    resp = preprocessor.save_chunks(enhanced_path, splits_dir, text_json_file)
    return resp
def convert_to_wav_bb(input_path, wav_path):
    logging.info(f"Converting {input_path} to WAV format at {wav_path}...")
    audio = AudioSegment.from_file(input_path)
    audio.export(wav_path, format="wav")
    logging.info(f"Audio saved to: {wav_path}")
    return wav_path


def convert_to_wav(input_path):
    """
    Convert input video file to WAV format using ffmpeg, forcing mono channel.
    The output file is saved in the same location with the same name but with a .wav extension.
    """

    # Generate WAV path by changing the file extension to '.wav'
    wav_path = os.path.splitext(input_path)[0] + ".wav"

    logging.info(f"Converting {input_path} to WAV format at {wav_path} using ffmpeg...")
    command = [
        "ffmpeg",
        "-y",  # Overwrite output file if it exists
        "-i", input_path,
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