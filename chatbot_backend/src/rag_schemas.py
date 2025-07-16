from pydantic import BaseModel, Field
from typing import List

class RagInput(BaseModel):
    question: str = Field(description="The question to ask the model.")

class RagOutput(BaseModel):
    answer: str = Field(description="The answer to the user's question based on the provided context.")
    citations: List[int] = Field(description="A list of citation ids that support the answer, formatted as a list of integers.")

class ReformulateQuestioOutput(BaseModel):
    question: str = Field(description="The concise follow-up reformulated question made based on previous conversation history.")

class ChatRequest(BaseModel):
    session_id: str = Field(description="Unique identifier for the chat session")
    question: str = Field(description="The question to ask the model")
