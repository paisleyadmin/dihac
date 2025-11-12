#!/bin/bash
# Script to initialize Ollama with models

echo "Waiting for Ollama service to be ready..."
sleep 10

echo "Pulling llama2 model..."
curl -X POST http://ollama:11434/api/pull -d '{"name": "llama2"}'

echo "Model initialization complete!"
