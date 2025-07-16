import { ActivatedRoute } from '@angular/router';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { RagChatbotService } from '../../services/ragchatbot.service';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';

export interface CitationInfo {
  file_name: string;
  page_number: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  citation_info?: CitationInfo[];
}

@Component({
  selector: 'app-chat-message',
  standalone: false,
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})

export class ChatMessageComponent {
  busy?: Subscription;
  _subscriptionsList: Array<Subscription> = [];
  messages: ChatMessage[] = [];
  userInput: string = '';
  projectId: number | null = null;
  sessionId: string | null = null;
  fileNames: string[] = [];
  inputDisabled: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private router: Router,
    private ragChatbotService: RagChatbotService
  ) {
    this.route.queryParams.subscribe(params => {
      this.projectId = params['project_id'] ? +params['project_id'] : null;
    });
  }

  ngOnInit() {
    this.getProjectDetails();
  }

  // Call this after sessionId is set in getProjectDetails
  private loadMessagesIfSession() {
    if (this.sessionId) {
      this.getMessages();
    }
  }

  ngOnDestroy() {
    this._subscriptionsList.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  getProjectDetails() {
    if (this.projectId !== null) {
      this.busy = this.ragChatbotService.uniqueProject(this.projectId).subscribe({
        next: (response) => {
          if (response) {
            this.sessionId = response.session_id || null;
            this.fileNames = response.file_names || [];
            this.loadMessagesIfSession();
          } else {
            this.notificationService.pop('error', 'Project not found.');
          }
        },
        error: (error) => {
          console.error('Failed to retrieve project details:', error);
          this.notificationService.pop('error', 'Failed to retrieve project details. Please try again.');
        }
      });
    } else {
      this.notificationService.pop('warning', 'No project is selected.');
    }
  }

  getMessages() {
    if (!this.sessionId) {
      this.notificationService.pop('error', 'Session ID is missing. Cannot retrieve messages.');
      return;
    }
    this.busy = this.ragChatbotService.getSessionMessages(this.sessionId).subscribe({
      next: (response) => {
        if (response && response.messages) {
          this.messages = response.messages.map((msg: any) => ({
            role: msg.role,
            text: msg.content,
            citation_info: msg.citation_info || []
          })).reverse();
        } else {
          this.notificationService.pop('error', 'No messages found for this session.');
        }
      },
      error: (error) => {
        console.error('Failed to retrieve messages:', error);
        this.notificationService.pop('error', 'Failed to retrieve messages. Please try again.');
      }
    });
  }

  chatmessage() {
    if (!this.sessionId) {
      this.notificationService.pop('error', 'Session ID is missing. Cannot send message.');
      return;
    }
    const userMsg = this.userInput.trim();
    if (!userMsg) {
      return;
    }
    this.inputDisabled = true;
    this.messages.unshift({ role: 'user', text: userMsg });
    const chat = {
      session_id: this.sessionId,
      question: userMsg
    };
    this.userInput = '';
    this.busy = this.ragChatbotService.chatWithRag(chat).subscribe({
      next: (response) => {
        if (response && response.answer) {
          this.messages.unshift({
            role: 'assistant',
            text: response.answer,
            citation_info: response.citation_info || []
          });
        } else {
          this.notificationService.pop('error', 'No response from the assistant.');
        }
        this.inputDisabled = false;
      },
      error: (error) => {
        console.error('Chat message error:', error);
        this.notificationService.pop('error', 'Failed to send message. Please try again.');
        this.inputDisabled = false;
      }
    });
  }

  backToUpload() {
    this.projectId = null;
    this.router.navigate(['/upload'], { replaceUrl: true });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    this.router.navigate([''], { replaceUrl: true });
  }

  exportChatAsPDF() {
    if (!this.sessionId) {
      this.notificationService.pop('error', 'Session ID is missing. Cannot export chat.');
      return;
    }
    this.ragChatbotService.getSessionMessages(this.sessionId).subscribe({
      next: (response) => {
        if (response && response.messages) {
          const doc = new jsPDF();
          let y = 10;
          doc.setFontSize(14);
          doc.text('Chat History', 10, y);
          y += 10;
          response.messages.forEach((msg: any) => {
            doc.setFontSize(12);
            doc.setTextColor(msg.role === 'user' ? 0 : 0, 0, 255);
            doc.text(`${msg.role === 'user' ? 'User' : 'Assistant'}:`, 10, y);
            y += 7;
            doc.setTextColor(0, 0, 0);
            const lines = doc.splitTextToSize(msg.content, 180);
            doc.text(lines, 15, y);
            y += lines.length * 7;
            if (msg.citation_info && msg.citation_info.length > 0) {
              doc.setFontSize(10);
              doc.setTextColor(100);
              msg.citation_info.forEach((c: any) => {
                const parts = c.file_name.split(/[\\/]/);
                const fileName = parts[parts.length - 1];
                doc.text(
                  `Source:${fileName}(Page: ${c.page_number})`,
                  15,
                  y
                );
                y += 5;
              });
            }
            y += 3;
            if (y > 270) {
              doc.addPage();
              y = 10;
            }
          });
          doc.save(`chat_history_${this.sessionId}.pdf`);
        } else {
          this.notificationService.pop('error', 'No messages found to export.');
        }
      },
      error: (error) => {
        console.error('Failed to export messages:', error);
        this.notificationService.pop('error', 'Failed to export messages. Please try again.');
      }
    });
  }

  exportChatAsTXT() {
    if (!this.sessionId) {
      this.notificationService.pop('error', 'Session ID is missing. Cannot export chat.');
      return;
    }
    this.ragChatbotService.getSessionMessages(this.sessionId).subscribe({
      next: (response) => {
        if (response && response.messages) {
          let txtContent = 'Chat History\n\n';
          response.messages.forEach((msg: any) => {
            txtContent += `${msg.role === 'user' ? 'User' : 'Assistant'}:\n${msg.content}\n`;
            if (msg.citation_info && msg.citation_info.length > 0) {
              msg.citation_info.forEach((c: any) => {
                const parts = c.file_name.split(/[\\/]/);
                const fileName = parts[parts.length - 1];
                txtContent += `Source:${fileName}(Page: ${c.page_number})\n`;
              });
            }
            txtContent += '\n';
          });
          const blob = new Blob([txtContent], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chat_history_${this.sessionId}.txt`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          this.notificationService.pop('error', 'No messages found to export.');
        }
      },
      error: (error) => {
        console.error('Failed to export messages:', error);
        this.notificationService.pop('error', 'Failed to export messages. Please try again.');
      }
    });
  }

}
