import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RmitLoaderComponent } from '../../rmit-loader/rmit-loader.component'; // <-- adjust path if different

const API_BASE = 'http://localhost:8000';

interface CourseApi {
  id: number | string;
  name: string;
  course_code: string;
  created_at?: string;
  start_at?: string;
  end_at?: string;
  apply_assignment_group_weights?: boolean;
}

export interface CourseVM extends CourseApi {
  theory: { day: string; time: string; classroom: string };
  practical: { day: string; time: string; classroom: string };
}

@Component({
  selector: 'app-find-classmate',
  standalone: true,
  imports: [CommonModule, FormsModule, RmitLoaderComponent], // <-- include loader here
  templateUrl: './find-classmate.component.html',
  styleUrls: ['./find-classmate.component.css'],
})
export class FindClassmateComponent implements OnInit {
  private http = inject(HttpClient);

  loading = true;
  error: string | null = null;
  courses: CourseVM[] = [];

  private get userId(): number {
    const saved = localStorage.getItem('user_id');
    return saved ? Number(saved) : 4190959;
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<CourseApi[]>(`${API_BASE}/users/${this.userId}/courses`)
      .subscribe({
        next: (list) => {
          this.courses = (list ?? []).map((c) => ({
            ...c,
            theory:    { day: '', time: '', classroom: '' },
            practical: { day: '', time: '', classroom: '' },
          }));
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          const detail =
            (err.error && (err.error.detail || err.error.message)) ||
            err.message ||
            'Failed to load courses';
          this.error = typeof detail === 'string' ? detail : 'Failed to load courses';
        },
      });
  }

  saveDetails(): void {
    const payload = this.courses.map(({ theory, practical, ...c }) => ({
      ...c, theory, practical,
    }));
    console.log('Save payload:', payload);
    alert('Saved locally (check console). Wire a POST when your API is ready.');
  }
}
