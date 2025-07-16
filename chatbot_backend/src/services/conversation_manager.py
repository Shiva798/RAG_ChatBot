import re
import os
from typing import List, Dict
from langchain_groq import ChatGroq
from src.rag_schemas import ReformulateQuestioOutput
from dotenv import load_dotenv, find_dotenv

# Load environment variables from the specified .env file
_ = load_dotenv(find_dotenv())

# Load the LLM for summarization and query reformulation
groq_api_key = os.getenv('GROQ_API_TOKEN')
llm = ChatGroq(model="llama3-8b-8192", api_key=groq_api_key, temperature=0.2)

class ConversationManager:
    """Manages conversation flow, summarization, and context detection"""
    
    # Greeting patterns
    GREETINGS = [
        r'^\s*h(i|ello|ey)\s*$', 
        r'^\s*good\s*(morning|afternoon|evening)\s*$',
        r'^\s*greetings\s*$',
        r'^\s*howdy\s*$',
        r'^\s*yo\s*$'
    ]
    
    # Farewell patterns
    FAREWELLS = [
        r'^\s*bye\s*$',
        r'^\s*goodbye\s*$',
        r'^\s*see\s*you\s*$',
        r'^\s*exit\s*$',
        r'^\s*quit\s*$',
        r'^\s*done\s*$',
        r'^\s*thank\s*you\s*$',
        r'^\s*thanks\s*$'
    ]
    
    # Follow-up indicators
    FOLLOW_UP_INDICATORS = [
        r'\b(it|this|that|these|those|they|them|he|she|him|her)\b',
        r'\b(the document|the article|the paper|the text)\b',
        r'\b(more|further|additional|else|another)\b',
        r'\bmentioned\b',
        r'\bearlier\b',
        r'\babove\b',
        r'\bagain\b'
    ]

    @staticmethod
    def is_greeting(text: str) -> bool:
        """Detects if the input is a simple greeting."""
        text = text.lower().strip()
        return any(re.match(pattern, text) for pattern in ConversationManager.GREETINGS)
    
    @staticmethod
    def is_farewell(text: str) -> bool:
        """Detects if the input is a farewell message."""
        text = text.lower().strip()
        return any(re.match(pattern, text) for pattern in ConversationManager.FAREWELLS)
    
    @staticmethod
    def is_follow_up(text: str) -> bool:
        """Detects if the question appears to be a follow-up."""
        text = text.lower()
        # Check for pronouns and referential terms
        for pattern in ConversationManager.FOLLOW_UP_INDICATORS:
            if re.search(pattern, text):
                return True
        
        # Check if the question is very short (likely a follow-up)
        if len(text.split()) < 4 and ('?' in text or text.startswith('what') or 
                                      text.startswith('how') or text.startswith('why')):
            return True
            
        return False
    
    @staticmethod
    async def summarize_history(history: List[Dict]) -> str:
        """Summarizes conversation history for context."""
        if not history:
            return ""
        
        # If history is small enough, no need to summarize
        if len(history) <= 2:
            formatted = []
            for item in history:
                formatted.append(f"User asked: {item['question']}")
                formatted.append(f"Assistant answered: {item['answer']}")
            return "\n".join(formatted)
        
        # For larger histories, use LLM to summarize
        history_text = "\n".join([
            f"User: {item['question']}\nAssistant: {item['answer']}"
            for item in history[-10:]  # Use last 10 exchanges at most
        ])
        
        summarization_prompt = f"""
        Summarize the following conversation history concisely, focusing on key topics and information:
        
        {history_text}
        
        Summary:
        """
        
        summary = llm.invoke(summarization_prompt).content
        return summary
    
    @staticmethod
    async def reformulate_question(question: str, history: List[Dict]) -> str:
        """Converts a follow-up question into a standalone question using history."""
        if not history:
            return question
            
        # Get the last exchange for context
        recent_exchanges = history[-3:] if len(history) >= 3 else history
        context = "\n".join([
            f"User: {item['question']}\nAssistant: {item['answer']}"
            for item in recent_exchanges
        ])
        
        reformulation_prompt = f"""
        Given the following conversation history and a follow-up question, rewrite the follow-up
        as a complete, standalone question that includes all necessary context in a simple question where you does not make the question as complex.
        
        Conversation history:
        {context}
        
        Follow-up question: {question}
        
        Standalone question:
        """
        structured_llm = llm.with_structured_output(ReformulateQuestioOutput)
        reformulated = structured_llm.invoke(reformulation_prompt)
        return reformulated.question
    
    @staticmethod
    def get_greeting_response(text: str) -> str:
        """Returns an appropriate response to a greeting."""
        greetings = {
            "hi": "Hello! How can I help you today?",
            "hello": "Hello! How can I help you with your documents today?",
            "hey": "Hey there! What would you like to know?",
            "good morning": "Good morning! How may I assist you?",
            "good afternoon": "Good afternoon! What can I help you with?",
            "good evening": "Good evening! Feel free to ask me anything about your documents.",
            "greetings": "Greetings! How can I be of service?",
            "howdy": "Howdy! What information are you looking for?",
            "yo": "Hello there! What can I help you with today?"
        }
        
        text = text.lower().strip()
        for key in greetings:
            if key in text:
                return greetings[key]
        
        # Default greeting response
        return "Hello! How can I help you today?"
    
    @staticmethod
    def get_farewell_response(text: str) -> str:
        """Returns an appropriate response to a farewell."""
        return "Thank you for chatting with me. Have a great day! If you need any more information later, feel free to return."