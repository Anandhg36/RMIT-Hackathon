import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  // ⬇️ make router directives available in the template
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
})
export class DashboardComponent {}
