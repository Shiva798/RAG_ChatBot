export class RagChatbotEndpointsConfig {
    constructor() {}

    public configbaseUrl: string = 'http://127.0.0.1:8000';

    public getRagChatbotCreateUserEndpoint(): string {
        return this.configbaseUrl + '/auth/create_user';
    }

    public getRagChatbotLoginEndpoint(): string {
        return this.configbaseUrl + '/auth/login_user'; 
    }

    public getRagChatbotPasswordModificationEndpoint(): string {
        return this.configbaseUrl + '/auth/password_modification';
    }

    public getRagChatbotDeleteUserEndpoint(): string {
        return this.configbaseUrl + '/auth/delete_user';
    }

    public getRagChatbotOAuthTokenEndpoint(): string {
        return this.configbaseUrl + '/auth/oauth_token';
    }

    public getRagChatbotUploadFileEndpoint(): string {
        return this.configbaseUrl + '/files/upload';
    }

    public getRagChatbotGetFilesEndpoint(): string {
        return this.configbaseUrl + '/files/list';
    }

    public getRagChatbotDeleteFileEndpoint(fileId: string): string {
        return `${this.configbaseUrl}/files/${fileId}`;
    }

    public getRagChatbotCreateProjectEndpoint(): string {
        return this.configbaseUrl + '/projects/create';
    }

    public getRagChatbotJoinProjectEndpoint(projectId: string): string {
        return `${this.configbaseUrl}/projects/start/${projectId}`;
    }

    public getRagChatbotGetProjectsEndpoint(): string {
        return this.configbaseUrl + '/projects/list';
    }

    public getRagChatbotDeleteProjectEndpoint(projectId: string): string {
        return `${this.configbaseUrl}/projects/${projectId}`;
    }

    public getRagChatbotUniqueProjectEndpoint(projectId: string): string {
        return `${this.configbaseUrl}/projects/specific/${projectId}`;
    }

    public getRagChatbotSendMessageEndpoint(): string {
        return this.configbaseUrl + '/rag/document_chat';
    }

    public getRagChatbotCreateSessionEndpoint(): string {
        return this.configbaseUrl + '/rag/sessions/create';
    }

    public getWikiRagChatbotSendMessageEndpoint(): string {
        return this.configbaseUrl + '/rag/wikipedia_chat';
    }

    public getRagChatbotGetMessagesEndpoint(sessionId: string): string {
        return `${this.configbaseUrl}/rag/sessions/${sessionId}/messages`;
    }

}