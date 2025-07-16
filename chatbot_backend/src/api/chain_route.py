import uuid
from fastapi import APIRouter, HTTPException, Path
from src.services.llm_service import generate_response, generate_chat_response, generate_wikipedia_chat_response
from src.services.session_manager import SessionManager
from src.rag_schemas import RagInput, ChatRequest

# Existing RAG router
rag_router = APIRouter(prefix="/rag", tags=["RAG"])
session_manager = SessionManager()

@rag_router.post("/qa_rag")
async def answer_question(question: str):
    input = RagInput(question=question)
    try:
        response = generate_response(input.question)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@rag_router.post("/sessions/create")
async def create_session():
    new_session_id = f"session_{uuid.uuid4().hex[:10]}"
    session_manager.get_or_create_session(new_session_id)
    return {"session_id": new_session_id}

@rag_router.post("/document_chat")
async def chat(request: ChatRequest):
    try:
        # Validate that the session exists
        if not session_manager.session_exists(request.session_id):
            raise HTTPException(status_code=404, detail="Session not found. Create a new session first.")
        
        # Check if this session already received a farewell
        if session_manager.is_farewell(request.session_id):
            # Create a new session instead of continuing the old one
            new_session_id = f"session_{uuid.uuid4().hex[:10]}"
            session_manager.get_or_create_session(new_session_id)
            
            response = await generate_chat_response(new_session_id, request.question)
            return {
                "answer": response["answer"],
                "citation_info": response["citation_info"],
                "new_session_id": new_session_id,
                "message": "Previous conversation was closed. Created a new session."
            }
        
        response = await generate_chat_response(request.session_id, request.question)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@rag_router.post("/wikipedia_chat")
async def wikipedia_chat(request: ChatRequest):
    """
    Chat endpoint using Wikipedia as the retrieval source.
    Session is managed, but no project/vectorstore initialization is required.
    """
    try:
        # Validate or create session
        if not session_manager.session_exists(request.session_id):
            session_manager.get_or_create_session(request.session_id)

        # Handle farewell
        if session_manager.is_farewell(request.session_id):
            new_session_id = f"session_{uuid.uuid4().hex[:10]}"
            session_manager.get_or_create_session(new_session_id)
            answer = "Previous conversation was closed. Created a new session. Please ask your question again."
            return {
                "answer": answer,
                "wiki_citations": [],
                "new_session_id": new_session_id,
                "message": "Previous conversation was closed. Created a new session."
            }

        # Use the new service function for Wikipedia chat
        response = await generate_wikipedia_chat_response(request.session_id, request.question)
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wikipedia chat error: {str(e)}")
    
@rag_router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str = Path(..., description="ID of the session to retrieve messages from")):
    """
    Retrieve all messages for a particular session, showing the conversation 
    between the user and the AI assistant.
    """
    try:
        if not session_manager.session_exists(session_id):
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
            
        messages = session_manager.get_session_messages(session_id)
        return {
            "session_id": session_id,
            "messages": messages,
            "message_count": len(messages) // 2  # Divide by 2 as each interaction has user + assistant message
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session messages: {str(e)}")

