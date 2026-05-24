from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
from datetime import datetime
import uuid
import json
from utils.chat_engine import MedicalChatEngine
from utils.session_manager import SessionManager

app = Flask(__name__)
app.secret_key = "medai_secret_key_2024"
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

session_manager = SessionManager()


@app.route("/")
def index():
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())
    return render_template("index.html")


@app.route("/api/init_session", methods=["POST"])
def init_session():
    data = request.json
    user_id = session.get("user_id", str(uuid.uuid4()))
    role = data.get("role", "patient")
    name = data.get("name", "User")

    session_manager.create_session(user_id, role, name)
    session["user_id"] = user_id
    session["role"] = role
    session["name"] = name

    return jsonify({"status": "ok", "user_id": user_id, "role": role})


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_id = session.get("user_id")
    role = session.get("role", "patient")
    name = session.get("name", "User")
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Empty message"}), 400

    user_session = session_manager.get_session(user_id)
    if not user_session:
        session_manager.create_session(user_id, role, name)
        user_session = session_manager.get_session(user_id)

    engine = MedicalChatEngine(role=role)
    response = engine.chat(message, user_session["history"])

    session_manager.add_message(user_id, "user", message)
    session_manager.add_message(user_id, "assistant", response)

    return jsonify({
        "response": response,
        "timestamp": datetime.now().strftime("%H:%M"),
        "role": role
    })


@app.route("/api/history", methods=["GET"])
def get_history():
    user_id = session.get("user_id")
    user_session = session_manager.get_session(user_id)
    if not user_session:
        return jsonify({"history": []})
    return jsonify({"history": user_session["history"]})


@app.route("/api/clear_history", methods=["POST"])
def clear_history():
    user_id = session.get("user_id")
    role = session.get("role", "patient")
    name = session.get("name", "User")
    session_manager.create_session(user_id, role, name)
    return jsonify({"status": "cleared"})


@app.route("/api/quick_prompts", methods=["GET"])
def quick_prompts():
    role = session.get("role", "patient")
    if role == "doctor":
        prompts = [
            "Differential diagnosis for chest pain",
            "Drug interaction: metformin + warfarin",
            "Latest hypertension treatment guidelines",
            "Interpret elevated troponin levels",
            "Dosage for pediatric amoxicillin",
        ]
    else:
        prompts = [
            "What are symptoms of diabetes?",
            "How to lower blood pressure naturally?",
            "When should I see a doctor for a fever?",
            "What causes frequent headaches?",
            "Is my BMI healthy?",
        ]
    return jsonify({"prompts": prompts})


if __name__ == "__main__":
    socketio.run(app, debug=True, port=5000)
