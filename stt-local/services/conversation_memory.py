from collections import deque
from threading import Lock
from typing import Deque, Dict, List


class ConversationMemory:
    def __init__(self, max_messages: int = 6):
        self.max_messages = max_messages
        self._store: Dict[str, Deque[dict]] = {}
        self._lock = Lock()

    def _get_session(self, session_id: str) -> Deque[dict]:
        if session_id not in self._store:
            self._store[session_id] = deque(maxlen=self.max_messages)
        return self._store[session_id]

    def add_user_message(self, session_id: str, content: str) -> None:
        if not content or not content.strip():
            return
        with self._lock:
            self._get_session(session_id).append({
                "role": "user",
                "content": content.strip()
            })

    def add_assistant_message(self, session_id: str, content: str) -> None:
        if not content or not content.strip():
            return
        with self._lock:
            self._get_session(session_id).append({
                "role": "assistant",
                "content": content.strip()
            })

    def get_messages(self, session_id: str) -> List[dict]:
        with self._lock:
            return list(self._get_session(session_id))

    def clear(self, session_id: str) -> None:
        with self._lock:
            if session_id in self._store:
                del self._store[session_id]


memory = ConversationMemory(max_messages=6)
