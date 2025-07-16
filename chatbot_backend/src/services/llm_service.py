import os
from langchain_groq import ChatGroq
from src.initialize import vector_store
from src.prompt_template import rag_prompt, chat_rag_prompt, chat_wiki_prompt
from src.rag_schemas import RagOutput
from src.services.session_manager import SessionManager
from src.services.conversation_manager import ConversationManager
from src.prompt_template import chat_rag_prompt, rag_prompt
from src.initialize import vector_store

# Retrieve API key from environment variables
groq_api_key = os.getenv('GROQ_API_TOKEN')

# LLM Model
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=groq_api_key, temperature=0.2)

# Initialize managers
session_manager = SessionManager()
conversation_manager = ConversationManager()

def generate_response(question: str):
    """Generate response for one-off questions without session context."""
    retrieved_docs = vector_store.get_retriever(question)
    prompt_input = {
        "context": retrieved_docs,
        "question": question
    }
    prompt = rag_prompt(prompt_input)
    # Get response from LLM
    structured_llm = llm.with_structured_output(RagOutput)
    response = structured_llm.invoke(prompt)
    citation_info = vector_store.get_citation_info(response.citations)
    
    # Return response and source documents
    return {
        "answer": response.answer,
        "citation_info": citation_info
    }

async def generate_chat_response(session_id: str, question: str):
    """Generate responses with conversation context and smart routing."""
    # Check for greetings or farewells
    if ConversationManager.is_greeting(question):
        greeting_response = ConversationManager.get_greeting_response(question)
        session_manager.add_interaction(
            session_id=session_id,
            question=question,
            answer=greeting_response
        )
        return {
            "answer": greeting_response,
            "citation_info": []
        }
    
    # Check for farewells
    if ConversationManager.is_farewell(question):
        farewell_response = ConversationManager.get_farewell_response(question)
        session_manager.add_interaction(
            session_id=session_id,
            question=question,
            answer=farewell_response
        )
        session_manager.mark_farewell(session_id)
        return {
            "answer": farewell_response,
            "citation_info": []
        }
    
    # Get conversation history
    history = session_manager.get_history_as_list(session_id)
    
    if history:
        if ConversationManager.is_follow_up(question):
            reformulated_question = await ConversationManager.reformulate_question(question, history)
            print(f"Original question: {question}, Reformulated question: {reformulated_question}")
        else:
            reformulated_question = question
            print(f"Original question: {question}", "Reformulated question: No reformulation needed")
        history_summary = await ConversationManager.summarize_history(history)
        retrieved_docs = vector_store.get_retriever(reformulated_question)
        prompt_input = {
            "context": retrieved_docs,
            "question": question,
            "history": history_summary
        }
    else:
        retrieved_docs = vector_store.get_retriever(question)
        prompt_input = {
            "context": retrieved_docs,
            "question": question,
            "history": ""
        }
    prompt_template = chat_rag_prompt(prompt_input)
    
    # Get response from LLM
    structured_llm = llm.with_structured_output(RagOutput)
    response = structured_llm.invoke(prompt_template)
    citation_info = vector_store.get_citation_info(response.citations)
    
    # Store the interaction in the session
    session_manager.add_interaction(
        session_id=session_id,
        question=question,
        answer=response.answer,
        context=retrieved_docs,
        citations=response.citations
    )
    
    # Return response and source documents
    return {
        "answer": response.answer,
        "citation_info": citation_info
    }

async def generate_wikipedia_chat_response(session_id: str, question: str):
    """
    Generate Wikipedia-based chat responses with session management.
    """
    # Handle greetings/farewells
    if ConversationManager.is_greeting(question):
        greeting_response = ConversationManager.get_greeting_response(question)
        session_manager.add_interaction(
            session_id=session_id,
            question=question,
            answer=greeting_response
        )
        return {
            "answer": greeting_response,
            "wiki_citations": []
        }

    if ConversationManager.is_farewell(question):
        farewell_response = ConversationManager.get_farewell_response(question)
        session_manager.add_interaction(
            session_id=session_id,
            question=question,
            answer=farewell_response
        )
        session_manager.mark_farewell(session_id)
        return {
            "answer": farewell_response,
            "wiki_citations": []
        }

    # Get conversation history
    history = session_manager.get_history_as_list(session_id)

    if history:
        if ConversationManager.is_follow_up(question):
            reformulated_question = await ConversationManager.reformulate_question(question, history)
            print(f"Original question: {question}, Reformulated question: {reformulated_question}")
        else:
            reformulated_question = question
            print(f"Original question: {question}", "Reformulated question: No reformulation needed")
        history_summary = await ConversationManager.summarize_history(history)
        retrieved_docs = vector_store.get_wikipedia_retriever(reformulated_question)
        prompt_input = {
            "context": retrieved_docs,
            "question": question,
            "history": history_summary
        }
    else:
        retrieved_docs = vector_store.get_wikipedia_retriever(question)
        prompt_input = {
            "context": retrieved_docs,
            "question": question,
            "history": ""
        }
    prompt_template = chat_wiki_prompt(prompt_input)

    # Get response from LLM
    structured_llm = llm.with_structured_output(RagOutput)
    response = structured_llm.invoke(prompt_template)

    # Format Wikipedia citations
    wiki_citations = []
    for citation_id in response.citations:
        if isinstance(citation_id, int) and 0 <= citation_id < len(vector_store.last_retrieved_docs):
            doc = vector_store.last_retrieved_docs[citation_id]
            source_url = doc.metadata.get("source", "")
            wiki_citations.append({
                "url": source_url,
                "id": citation_id
            })

    # Store interaction
    session_manager.add_interaction(
        session_id=session_id,
        question=question,
        answer=response.answer,
        context=retrieved_docs,
        citations=response.citations
    )

    return {
        "answer": response.answer,
        "wiki_citations": wiki_citations
    }
