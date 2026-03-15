import pandas as pd
import json
import os
import urllib.request
import zipfile

def download_goemotions():
    print("Downloading GoEmotions dataset...")
    url = "https://github.com/google-research/google-research/raw/master/goemotions/data/train.tsv"
    os.makedirs("data", exist_ok=True)
    urllib.request.urlretrieve(url, "data/train.tsv")
    print("Downloaded train.tsv")

def process_goemotions():
    print("Processing GoEmotions...")
    emotion_labels = [
        # 28 emotions from GoEmotions, we map them to our 6 root buckets
        "admiration", "amusement", "anger", "annoyance", "approval", "caring",
        "confusion", "curiosity", "desire", "disappointment", "disapproval",
        "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief",
        "joy", "love", "nervousness", "optimism", "pride", "realization",
        "relief", "remorse", "sadness", "surprise", "neutral"
    ]
    
    # Mapping to Mannmitra's core buckets: 
    # Joy, Sadness, Fear (Apprehension), Anger, Fatigue (mapped loosely), Contemplation (Neutral/Surprise)
    mapping = {
        "admiration": "joy", "amusement": "joy", "anger": "anger", "annoyance": "anger",
        "approval": "joy", "caring": "joy", "confusion": "contemplation", "curiosity": "contemplation",
        "desire": "joy", "disappointment": "sadness", "disapproval": "anger", "disgust": "anger",
        "embarrassment": "sadness", "excitement": "joy", "fear": "fear", "gratitude": "joy",
        "grief": "sadness", "joy": "joy", "love": "joy", "nervousness": "fear", "optimism": "joy",
        "pride": "joy", "realization": "contemplation", "relief": "joy", "remorse": "sadness",
        "sadness": "sadness", "surprise": "contemplation", "neutral": "contemplation"
    }

    df = pd.read_csv("data/train.tsv", sep='\t', header=None, names=["text", "labels", "id"])
    
    processed_data = []
    
    for _, row in df.iterrows():
        # Labels are comma-separated indices
        label_indices = [int(idx) for idx in str(row["labels"]).split(",")]
        # Take the first label for simplicity in this dataset prep
        primary_label_idx = label_indices[0]
        
        # Protect against out of bounds if dataset format changed slightly
        if primary_label_idx < len(emotion_labels):
            original_emotion = emotion_labels[primary_label_idx]
            mapped_emotion = mapping.get(original_emotion, "contemplation")
            
            processed_data.append({
                "text": row["text"],
                "original_emotion": original_emotion,
                "mapped_emotion": mapped_emotion
            })

    output_file = "data/mannmitra_goemotions_mapped.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=2, ensure_ascii=False)
        
    print(f"Processed {len(processed_data)} rows. Saved to {output_file}")

if __name__ == "__main__":
    download_goemotions()
    process_goemotions()
