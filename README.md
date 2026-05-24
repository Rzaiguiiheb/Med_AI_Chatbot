# 🏥 MedAI — Local Medical Chatbot

A modern medical AI assistant powered by **Ollama** (local LLM) and **LangChain**, with a clean dark-mode web interface. Supports both **patient** and **doctor** modes with different system prompts and quick-access prompts.

---

## ✨ Features

- 🩺 **Dual-mode**: Patient (plain language) and Doctor (clinical, evidence-based)
- 🔒 **Fully local**: Runs on Ollama — your data never leaves your machine
- 💬 **Conversation memory**: Maintains context across the full session
- 📋 **Markdown rendering**: Formatted AI responses with lists, headers, bold
- ⚡ **Quick prompts**: Pre-built starter questions for each role
- 🎨 **Dark/Light theme**: Toggleable, persisted in localStorage
- 📱 **Responsive**: Works on mobile too
- 🔄 **Role switching**: Change between patient and doctor mid-session

---

## 🚀 Quick Start

### 1. Install Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from https://ollama.com/download
```

### 2. Pull a Model

```bash
# Recommended (general purpose, fast)
ollama pull llama3.2

# For medical use (if available)
ollama pull meditron

# Other options
ollama pull mistral
ollama pull llama3.1
ollama pull gemma2
```

### 3. Start Ollama Server

```bash
ollama serve
```

> Ollama runs on `http://localhost:11434` by default.

### 4. Set Up Python Environment

```bash
cd medai_chatbot

# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt
```

### 5. Run the App

```bash
python app.py
```

Open your browser at: **http://localhost:5000**

---

## 🗂️ Project Structure

```
medai_chatbot/
├── app.py                  # Flask application entry point
├── requirements.txt        # Python dependencies
├── README.md
├── utils/
│   ├── __init__.py
│   ├── chat_engine.py      # LangChain + Ollama integration
│   └── session_manager.py  # In-memory session/history management
├── templates/
│   └── index.html          # Main UI template
└── static/
    ├── css/
    │   └── style.css       # Full UI styling
    └── js/
        └── app.js          # Frontend logic
```

---

## ⚙️ Configuration

### Changing the Default Model

Edit `utils/chat_engine.py`:

```python
class MedicalChatEngine:
    def __init__(self, role: str = "patient", model: str = "llama3.2"):
```

Or use the **Settings** panel in the UI to switch models at runtime.

### Customizing System Prompts

Edit `SYSTEM_PROMPTS` in `utils/chat_engine.py`:

```python
SYSTEM_PROMPTS = {
    "patient": "...",
    "doctor": "..."
}
```

---

## ⚠️ Disclaimer

MedAI is an **educational and informational tool only**. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.

In case of emergency, call your local emergency number (15 in Tunisia, 112 in the EU, 911 in the US).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask, Flask-SocketIO |
| AI Engine | LangChain + Ollama |
| Frontend | HTML5, CSS3, Vanilla JS |
| Markdown | marked.js |
| Fonts | Sora, JetBrains Mono (Google Fonts) |
