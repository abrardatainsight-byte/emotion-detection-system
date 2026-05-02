from huggingface_hub import snapshot_download

print("Downloading AI model directly to disk (bypassing RAM limit)...")
snapshot_download(repo_id="dima806/facial_emotions_image_detection")
print("Download complete!")