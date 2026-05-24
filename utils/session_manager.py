from datetime import datetime
from typing import Optional, Dict


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, dict] = {}

    def create_session(self, user_id: str, role: str = "patient", name: str = "User"):
        self._sessions[user_id] = {
            "user_id": user_id,
            "role": role,
            "name": name,
            "history": [],
            "created_at": datetime.now().isoformat(),
            "last_active": datetime.now().isoformat(),
        }

    def get_session(self, user_id: str) -> Optional[dict]:
        return self._sessions.get(user_id)

    def add_message(self, user_id: str, role: str, content: str):
        if user_id not in self._sessions:
            return
        self._sessions[user_id]["history"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        })
        self._sessions[user_id]["last_active"] = datetime.now().isoformat()

    def clear_history(self, user_id: str):
        if user_id in self._sessions:
            self._sessions[user_id]["history"] = []

    def get_history(self, user_id: str) -> list:
        session = self.get_session(user_id)
        return session["history"] if session else []
