import { HttpClient } from "@angular/common/http";
import { RagChatbotEndpointsConfig } from "./ragchatbot.endpoints.config";
import { CreateUser,LoginUser,Password, OAuthToken, Chat} from "./ragchatbot.model";
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class RagChatbotService {
    private endpointsConfig: RagChatbotEndpointsConfig;

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.endpointsConfig = new RagChatbotEndpointsConfig();
    }

    create_user(CreateUser: CreateUser) {
        const url = this.endpointsConfig.getRagChatbotCreateUserEndpoint();
        return this.http.post(url, CreateUser);
    }

    login_user(LoginUser : LoginUser) {
        const url = this.endpointsConfig.getRagChatbotLoginEndpoint();
        return this.http.post(url, LoginUser);
    }

    forgot_password(Password: Password) {
        const url = this.endpointsConfig.getRagChatbotPasswordModificationEndpoint();
        return this.http.put(url, Password);
    }

    oauth_token(OAuthToken: OAuthToken) {
        const url = this.endpointsConfig.getRagChatbotOAuthTokenEndpoint();
        const formData = new FormData();
        formData.append('username', OAuthToken.username);
        formData.append('password', OAuthToken.password);
        formData.append('grant_type', 'password');
        
        return this.http.post(url, formData);
    }

    uploadFiles(files: File[]): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotUploadFileEndpoint();
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file, file.name);
        });
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.post(url, formData, { headers });
    }

    getFiles(): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotGetFilesEndpoint();
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.get(url, { headers });
    }   

    deleteFile(fileId: number): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotDeleteFileEndpoint(fileId.toString());
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.delete(url, { headers });
    }

    createProject(projectName: string, fileIds: number[]): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotCreateProjectEndpoint();
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        const body = {
            project_name: projectName,
            file_ids: fileIds
        };
        return this.http.post(url, body, { headers });
    }

    joinProject(projectId: number): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotJoinProjectEndpoint(projectId.toString());
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.post(url, {}, { headers });
    }

    getProjects(): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotGetProjectsEndpoint();
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.get(url, { headers });
    }

    deleteProject(projectId: number): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotDeleteProjectEndpoint(projectId.toString());
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.delete(url, { headers });
    }

    uniqueProject(projectId: number): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotUniqueProjectEndpoint(projectId.toString());
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.get(url, { headers });
    }

    chatWithRag(chat: Chat): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotSendMessageEndpoint();
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.post(url, chat, { headers });
    }

    createSession(): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotCreateSessionEndpoint();
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.post(url, {}, { headers });
    }

    chatwithWikiRag(chat: Chat): Observable<any> {
        const url = this.endpointsConfig.getWikiRagChatbotSendMessageEndpoint();
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.post(url, chat, { headers });
    }

    getSessionMessages(sessionId: string): Observable<any> {
        const url = this.endpointsConfig.getRagChatbotGetMessagesEndpoint(sessionId);
        let headers = {};
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        return this.http.get(url, { headers });
    }
}