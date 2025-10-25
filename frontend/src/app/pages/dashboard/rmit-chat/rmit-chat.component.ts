import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

const API_BASE = 'http://localhost:8010';

// what we expect back from /query
interface QueryResponse {
  reply: string; // e.g. "Here are your courses..."
}

// message model for the UI
interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

@Component({
  selector: 'app-rmit-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rmit-chat.component.html',
  styleUrls: ['./rmit-chat.component.css'],
})
export class RmitChatComponent {
  private http = inject(HttpClient);

  // bound to the input box
  inputText = '';

  // disable input while request is running
  sending = false;

  // chat history rendered in UI (dummy starter values so you can SEE layout)
  messages: ChatMessage[] = [
    {
      role: 'bot',
      text:
        "Sweet, let's do a clean nuke-and-reinstall cycle so your backend/uvicorn/etc runs fresh.",
    },
    {
      role: 'user',
      text: 'remove and install',
    },
    {
      role: 'user',
      text: 'Give my all courses',
    },
    {
      role: 'bot',
      text:
        'Here are the courses I found for you:\n\n' +
        '• COSC1234 - Software Engineering 1\n' +
        '  - Theory: Mon 10:30 - 12:30, 08.03.12\n' +
        '  - Practical: Wed 14:00 - 16:00, 10.04.22\n\n' +
        '• ISYS5678 - Data Management\n' +
        '  - Theory: Tue 09:00 - 11:00, 05.02.10\n' +
        '  - Practical: Thu 13:00 - 15:00, 06.01.07',
    },
    {
      role: 'bot',
      text:
        'Do you want me to connect you with classmates in the same practical lab group?',
    },
    {
      role: 'user',
      text: 'yes, practical group for Data Management',
    },
  ];

  /**
   * Triggered when user hits Enter in the input.
   * 1. Add user's message to messages[]
   * 2. Add "..." placeholder bot message to messages[]
   * 3. Call POST /query
   * 4. Replace "..." with actual reply
   */
  onEnter(): void {
    const text = this.inputText.trim();
    if (!text || this.sending) return;

    // 1. push user message immediately so it appears in UI
    this.messages.push({
      role: 'user',
      text,
    });

    // 2. clear input
    this.inputText = '';

    // 3. lock input while we wait
    this.sending = true;

    // 4. add a placeholder "..." bot bubble and remember its index
    const pendingIndex = this.messages.push({
      role: 'bot',
      text: '...', // temporary bot thinking message
    }) - 1;

    // 5. POST to backend
    // Body shape: { query: "<user typed text>" }
    const body = { query: text };

    this.http.post<QueryResponse>(`${API_BASE}/query`, body).subscribe({
      next: (res) => {
        this.sending = false;

        // replace placeholder with backend's actual reply
        this.messages[pendingIndex] = {
          role: 'bot',
          text: res?.reply ?? '(no response)',
        };
      },
      error: (err: HttpErrorResponse) => {
        this.sending = false;

        const detail =
          (err.error && (err.error.detail || err.error.message)) ||
          err.message ||
          'Something went wrong';

        // replace placeholder with error text
        this.messages[pendingIndex] = {
          role: 'bot',
          text: `Error: ${detail}`,
        };
      },
    });
  }
}
