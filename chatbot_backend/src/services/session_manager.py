from src.initialize import vector_store 

class SessionManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SessionManager, cls).__new__(cls)
            cls._instance.sessions = {}
        return cls._instance
    
    def session_exists(self, session_id):
        """Check if a session with the given ID exists."""
        return session_id in self.sessions
    
    def get_or_create_session(self, session_id):
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "history": [],
                "last_context": None,
                "last_citations": [],
                "summary": None,
                "is_farewell": False
            }
        return self.sessions[session_id]
    
    def get_session_messages(self, session_id):
        """
        Get all messages for a specific session formatted as a conversation.
        Returns a list of dictionaries with role and content.
        """
        if not self.session_exists(session_id):
            return []
            
        session = self.get_or_create_session(session_id)
        messages = []
        
        for interaction in session["history"]:
            messages.append({
                "role": "user",
                "content": interaction["question"],
                "timestamp": interaction.get("timestamp", None)
            })
            assistant_msg = {
                "role": "assistant", 
                "content": interaction["answer"],
                "timestamp": interaction.get("timestamp", None)
            }
            # Use citation_info stored at the time of interaction
            if interaction.get("citation_info"):
                assistant_msg["citation_info"] = interaction["citation_info"]
            messages.append(assistant_msg)
            
        return messages
    
    def get_all_sessions_with_last_message(self):
        """
        Get all active session IDs with their last user message.
        Returns a list of dictionaries with session_id and last_message.
        """
        result = []
        
        for session_id, session_data in self.sessions.items():
            if session_data["history"]:
                last_message = session_data["history"][-1]["question"]
                result.append({
                    "session_id": session_id,
                    "last_message": last_message,
                    "timestamp": session_data["history"][-1].get("timestamp", None),
                    "message_count": len(session_data["history"]),
                    "is_farewell": session_data.get("is_farewell", False)
                })
            else:
                result.append({
                    "session_id": session_id,
                    "last_message": None,
                    "message_count": 0,
                    "is_farewell": session_data.get("is_farewell", False)
                })
        
        # Sort by most recent first (assuming we have timestamps)
        # If no timestamps are available, this will maintain original order
        result.sort(key=lambda x: x.get("timestamp", 0) if x.get("timestamp") else 0, reverse=True)
        
        return result
    
    def add_interaction(self, session_id, question, answer, context=None, citations=None):
        """Updated to include timestamps"""
        import datetime
        
        session = self.get_or_create_session(session_id)
        # Store citation_info at the time of interaction
        citation_info = None
        if citations:
            citation_info = vector_store.get_citation_info(citations)
        interaction = {
            "question": question,
            "answer": answer,
            "timestamp": datetime.datetime.now().isoformat(),
            "citations": citations,
            "citation_info": citation_info  # <-- store here
        }
        session["history"].append(interaction)
        if context:
            session["last_context"] = context
        if citations:
            session["last_citations"] = citations
        
        # Keep only the last 10 interactions to manage memory size
        if len(session["history"]) > 10:
            session["history"] = session["history"][-10:]
    
    def get_conversation_history(self, session_id):
        session = self.get_or_create_session(session_id)
        history = []
        for interaction in session["history"]:
            history.append(f"User: {interaction['question']}")
            history.append(f"Assistant: {interaction['answer']}")
        
        return "\n".join(history)
    
    def get_history_as_list(self, session_id):
        """Returns history as a list of dictionaries for processing."""
        session = self.get_or_create_session(session_id)
        return session["history"].copy()
    
    def mark_farewell(self, session_id):
        """Mark this session as having received a farewell."""
        session = self.get_or_create_session(session_id)
        session["is_farewell"] = True
    
    def is_farewell(self, session_id):
        """Check if this session has received a farewell."""
        session = self.get_or_create_session(session_id)
        return session.get("is_farewell", False)
    
    def clear_session(self, session_id):
        if session_id in self.sessions:
            del self.sessions[session_id]