export interface CreateUser {
    username: string;
    email: string;
    password: string;
}

export interface LoginUser {
    username: string;
    password: string;
}

export interface Password {
    identifier: string;
    new_password: string;
}

export interface OAuthToken {
    grant_type: string;
    username: string;
    password: string;
}

export interface Chat { 
    session_id: string;
    question: string;
}

export interface ApiFile {
  file_id: number;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  selected?: boolean;
}