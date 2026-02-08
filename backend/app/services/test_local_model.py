from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

print("📥 Downloading TinyLlama model (2.2GB)...")
print("This is smaller and more reliable!\n")

model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="cpu"
)

print("\n✅ Model downloaded successfully!")
print("Testing generation...\n")

messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is photosynthesis? Give me 3 key points in JSON format."}
]

text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
inputs = tokenizer(text, return_tensors="pt")

with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.7,
        do_sample=True
    )

response = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"📝 Test response:\n{response}\n")
print("🎉 TinyLlama is working!")