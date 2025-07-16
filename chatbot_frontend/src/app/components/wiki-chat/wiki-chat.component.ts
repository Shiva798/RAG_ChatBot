import { ActivatedRoute } from '@angular/router';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { RagChatbotService } from '../../services/ragchatbot.service';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';

export interface CitationInfo {
  url: string;
  id: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  citation_info?: CitationInfo[];
}

@Component({
  selector: 'app-wiki-chat',
  standalone: false,
  templateUrl: './wiki-chat.component.html',
  styleUrl: './wiki-chat.component.scss'
})
export class WikiChatComponent {
  busy?: Subscription;
  _subscriptionsList: Array<Subscription> = [];
  messages: ChatMessage[] = [];
  userInput: string = '';
  sessionId: string | null = null;
  inputDisabled: boolean = false;

  @ViewChild('chatContainer') chatContainer?: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private router: Router,
    private ragChatbotService: RagChatbotService
  ) {}

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer && this.chatContainer.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }

  ngOnInit() {
    const storedSessionId = localStorage.getItem('session_id');
    if (storedSessionId) {
      this.sessionId = storedSessionId;
      this.loadMessagesIfSession();
    } else {
      this.createSession();
    }
  }

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

  // API calls
  createSession() {
    this.ragChatbotService.createSession().subscribe({
      next: (response) => {
        if (response && response.session_id) {
          this.sessionId = response.session_id;
          localStorage.setItem('session_id', response.session_id);
        } else {
          this.notificationService.pop('error', 'Failed to create session.');
        }
      },
      error: (error) => {
        console.error('Error creating session:', error);
        this.notificationService.pop('error', 'Failed to create session. Please try again.');
      }
    });
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
            citation_info: (msg.citation_info || []).map((c: any) => ({
              url: c.file_name, // Map file_name to url
              id: c.id || null
            }))
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
    this.scrollToBottom(); // <-- Add this line
    const chat = {
      session_id: this.sessionId,
      question: userMsg
    };
    this.userInput = '';
    this.busy = this.ragChatbotService.chatwithWikiRag(chat).subscribe({
      next: (response) => {
        if (response && response.answer) {
          this.messages.unshift({
            role: 'assistant',
            text: response.answer,
            citation_info: response.wiki_citations || []
          });
          this.scrollToBottom();
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
    this.router.navigate(['/upload'], { replaceUrl: true });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('session_id'); 
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
                doc.text(
                  `Source: ${c.file_name}`,
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
                txtContent += `Source: ${c.file_name}\n`;
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
