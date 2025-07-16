import os
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader, UnstructuredWordDocumentLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.retrievers import WikipediaRetriever

def generate_embeddings(documents):
    modelname = "sentence-transformers/all-mpnet-base-v2"
    model_kwargs = {'device': 'cpu'}
    encode_kwargs = {'normalize_embeddings': False}
    embeddings = HuggingFaceEmbeddings(
        model_name=modelname, 
        model_kwargs=model_kwargs, 
        encode_kwargs=encode_kwargs
    )
    return FAISS.from_documents(documents, embeddings)

class VectorStore:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(VectorStore, cls).__new__(cls)
            cls._instance.vectorstore_db = None
            cls._instance.last_retrieved_docs = []
        return cls._instance

    def process_documents(self, directory_path: str):
        """
        Process documents from directory supporting PDF, DOCX, and TXT files
        """
        documents = []
        
        # Configure loaders for different file types
        loaders = {
            '.pdf': DirectoryLoader(
                directory_path, 
                glob="**/*.pdf", 
                loader_cls=PyPDFLoader
            ),
            '.docx': DirectoryLoader(
                directory_path, 
                glob="**/*.docx", 
                loader_cls=UnstructuredWordDocumentLoader
            ),
            '.txt': DirectoryLoader(
                directory_path, 
                glob="**/*.txt", 
                loader_cls=TextLoader
            )
        }
        
        # Load documents for each supported file type
        for file_type, loader in loaders.items():
            try:
                docs = loader.load()
                if docs:
                    print(f"Loaded {len(docs)} {file_type} documents")
                    documents.extend(docs)
            except Exception as e:
                print(f"Error loading {file_type} documents: {str(e)}")
        
        if not documents:
            raise ValueError("No supported documents found in the directory")
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        split_docs = text_splitter.split_documents(documents)
        return split_docs

    def load_embeddings(self, directory_path: str):
        """
        Load and generate embeddings for PDF, DOCX, and TXT files
        """
        try:
            if not os.path.exists(directory_path):
                raise ValueError(f"Directory not found: {directory_path}")

            processed_docs = self.process_documents(directory_path)
            total_docs = len(processed_docs)
            
            if total_docs == 0:
                raise ValueError("No documents were processed")

            print(f"Total documents processed: {total_docs}")
            self.vectorstore_db = generate_embeddings(processed_docs)
            print("Documents processed and embeddings generated successfully")
            
            return {
                "status": "success",
                "message": f"Processed {total_docs} documents",
                "directory": directory_path
            }
        except Exception as e:
            error_msg = f"Error loading embeddings: {str(e)}"
            print(error_msg)
            raise ValueError(error_msg)

    def get_retriever(self, question: str):
        """
        Get relevant documents for a given question
        """
        if self.vectorstore_db is not None:
            retriever = self.vectorstore_db.as_retriever(
                search_type="similarity", 
                search_kwargs={'k': 2}
            )
            retrieved_docs = retriever.invoke(question)
            self.last_retrieved_docs = retrieved_docs
            
            formatted = [
                f"Source ID: {i}\nContext source: {doc.metadata.get('source', 'N/A')}\n"
                f"Context page content: {doc.page_content}"
                for i, doc in enumerate(retrieved_docs)
            ]
            return "\n\n" + "\n\n".join(formatted)
        raise ValueError("Embeddings not loaded. Please load embeddings first.")

    def get_citation_info(self, citation_ids):
        """
        Get citation information for given source IDs
        """
        results = []
        for citation_id in citation_ids:
            if isinstance(citation_id, int) and 0 <= citation_id < len(self.last_retrieved_docs):
                doc = self.last_retrieved_docs[citation_id]
                file_name = doc.metadata.get("source", "N/A")
                page_number = doc.metadata.get("page", "N/A")
                results.append({
                    "file_name": file_name, 
                    "page_number": page_number
                })
            else:
                results.append({
                    "file_name": "N/A", 
                    "page_number": "N/A"
                })
        return results
    
    def get_wikipedia_retriever(self, question: str):
        """
        Get relevant documents for a given question using Wikipedia retriever
        """
        wikipedia_retriever = WikipediaRetriever(
            top_k_results=3,  # Increased for better coverage
            doc_content_chars_max=4000
        )
        retrieved_docs = wikipedia_retriever.invoke(question)
        self.last_retrieved_docs = retrieved_docs
        
        # Enhanced formatting that includes title for better context
        formatted = []
        for i, doc in enumerate(retrieved_docs):
            formatted.append(
                f"Source ID: {i}\n"
                f"Context source: {doc.metadata.get('source', 'N/A')}\n"
                f"Context page content: {doc.page_content}"
            )
        
        return "\n\n" + "\n\n".join(formatted)
