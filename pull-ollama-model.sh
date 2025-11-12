#!/bin/bash
# Script to pull Ollama models into the containerized Ollama service

MODEL=${1:-llama2}

echo "Pulling $MODEL model into Ollama container..."
docker exec dihac-ollama ollama pull $MODEL

echo "Model $MODEL has been pulled successfully!"
echo "You can now use it in your LLM service."
