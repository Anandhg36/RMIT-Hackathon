import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'signup', loadComponent: () =>
      import('./pages/signup/signup.component').then(m => m.SignupComponent) },

  { path: 'login', loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent) },

 // app.routes.ts
 {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'find-classmate' },
      {
        path: 'find-classmate',
        loadComponent: () =>
          import('./pages/dashboard/find-classmate/find-classmate.component')
            .then(m => m.FindClassmateComponent),
      },
      {
        path: 'rmit-bot',
        loadComponent: () =>
          import('./pages/dashboard/rmit-chat/rmit-chat.component')
            .then(m => m.RmitChatComponent),
      },
      {
        path: 'chat-view',
        loadComponent: () =>
          import('./pages/dashboard/chat-view/chat-view.component')
            .then(m => m.ChatViewComponent),
      },
    ],
  },


  { path: '**', redirectTo: 'login' }
];
