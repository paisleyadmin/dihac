# LLM Setup Guide

This guide explains how to set up the local LLM on your Mac Studio Max.

## Option 1: Using Ollama (Recommended)

1. Install Ollama:
```bash
# macOS
curl -fsSL https://ollama.ai/install.sh | sh
```

2. Download a model:
```bash
# Recommended models for legal analysis:
ollama pull llama2
# or for better performance:
ollama pull mistral
# or for larger context:
ollama pull codellama
```

3. Start Ollama server:
```bash
ollama serve
```

The server will run on `http://localhost:11434` by default.

4. Test the API:
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

## Option 2: Using LM Studio

1. Download LM Studio from https://lmstudio.ai/
2. Install and open the application
3. Download a model (llama2, mistral, etc.)
4. Start the local server in LM Studio
5. Update `LLM_SERVICE_URL` in your `.env` file to point to LM Studio's API endpoint

## Option 3: Using vLLM

For better performance with larger models:

1. Install vLLM:
```bash
pip install vllm
```

2. Start the server:
```bash
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-2-7b-chat-hf \
  --port 8000
```

3. Update the API format in `analysis-service/main.py` to match OpenAI API format.

## Configuration

Update your `.env` file:

```env
LLM_SERVICE_URL=http://localhost:11434
LLM_MODEL=llama2
LLM_TEMPERATURE=0.7
```

## RAG Setup

To enhance the RAG layer:

1. Install a vector database (e.g., ChromaDB):
```bash
pip install chromadb
```

2. Update `analysis-service/main.py` to use ChromaDB for vector search instead of simple keyword matching.

3. Populate the RAG database with legal documents:
   - Legal statutes
   - Case law summaries
   - Legal precedents
   - Legal definitions

## Performance Tips

- Use quantized models (4-bit or 8-bit) for better performance
- Allocate sufficient RAM (Mac Studio Max should handle this well)
- Consider using GPU acceleration if available
- Monitor memory usage and adjust model size accordingly

