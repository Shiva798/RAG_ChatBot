import sqlite3

DATABASE = "./chat_rag.db"

# --- Database Utilities ---
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at DateTime DEFAULT CURRENT_TIMESTAMP,
            updated_at DateTime DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS file_details (
            file_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            file_name TEXT,
            file_path TEXT,
            uploaded_at DateTime DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS project_details (
            project_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            project_name TEXT NOT NULL,
            file_ids TEXT NOT NULL,
            session_id TEXT UNIQUE NOT NULL,  
            is_active BOOLEAN DEFAULT 1,
            initialization_status TEXT DEFAULT 'completed',  
            created_at DateTime DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Create indexes for faster lookups
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_user ON project_details(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_file_user ON file_details(user_id)")
    
    conn.commit()
    conn.close()