import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main class="container">
      <h1>Welcome to {{ title }} 👋</h1>
      <p>Edit <code>src/app/app.component.ts</code> and save to reload.</p>
      <button (click)="count++">Clicked {{ count }} times</button>
      <p class="note">Angular 18 • Standalone components • ESLint • Prettier</p>
    </main>
  `,
  styles: [`
    .container { padding: 2rem; }
    h1 { margin: 0 0 1rem; }
    .note { opacity: 0.7; }
    button { padding: .5rem 1rem; border-radius: .5rem; border: 1px solid #ccc; cursor: pointer; }
    button:hover { background: #f5f5f5; }
  `]
})
export class AppComponent {
  title = 'awesome-angular';
  count = 0;
}
