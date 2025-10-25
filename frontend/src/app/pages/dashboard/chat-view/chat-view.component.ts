import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

// If you're using Angular standalone API, keep standalone: true.
// If not standalone, remove `standalone` + `imports` and declare it in a module.

// Adjust this if you’re proxying /api → backend
const API_BASE = 'http://localhost:8010';

/** === Backend model ===
 * what your FastAPI /users/{id}/courses/find_classmate returns
 */
interface CourseApi {
  id: number | string;
  name: string;                     // course_name
  course_code?: string;
  created_at?: string;
  start_at?: string;
  end_at?: string;
  apply_assignment_group_weights?: boolean;
}

/** === Frontend view model ===
 * we extend each course with theory/practical
 * so the template can always safely read
 *   course.theory.day, etc.
 */
export interface CourseVM extends CourseApi {
  theory: {
    day: string;
    time: string;
    classroom: string;
  };
  practical: {
    day: string;
    time: string;
    classroom: string;
  };
}

@Component({
  selector: 'app-find-classmate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.css'],
})
export class ChatViewComponent implements OnInit {
  private http = inject(HttpClient);
  TAB_WIDTH = 260; // px. adjust (220, 240, etc) until it looks right in your layout


  // --- state ---
  loading = true;
  error: string | null = null;

  courses: CourseVM[] = [];          // hydrated list after fetch
  selectedIndex: number | null = null;
  selectedSubTab: 'theory' | 'practical' = 'theory';

  // You’ll replace this later with actual classmates per course.
  // For now this is static demo data.
  dummyStudents = [
    { name: 'Alex Tran' },
    { name: 'Priya Singh' },
    { name: 'Marcus Lee' },
    { name: 'Sofia Nguyen' },
  ];

  /** read the logged-in user ID
   * from localStorage (set during login),
   * fallback to your test ID.
   */
  private get userId(): number {
    const saved = localStorage.getItem('user_id');
    return saved ? Number(saved) : 4190959;
  }

  ngOnInit(): void {
    this.fetchCourses();
  }

  /** hit /users/{user_id}/courses/find_classmate */
  fetchCourses(): void {
    this.loading = true;
    this.error = null;

    this.http
  .get<CourseApi[]>(`${API_BASE}/users/${this.userId}/courses/find_classmate`)
  .subscribe({
    next: (apiList) => {
      // 1. Keep only active / current courses (those with no end_at)
      const activeOnly = (apiList ?? []).filter(c => c.end_at != null);

      // 2. Normalize each course into a CourseVM
      //    Add blank theory/practical fields so bindings never break
      this.courses = activeOnly.map((c) => ({
        ...c,
        theory: {
          day: '',
          time: '',
          classroom: '',
        },
        practical: {
          day: '',
          time: '',
          classroom: '',
        },
      }));

      // 3. Auto-select first course if available
      if (this.courses.length > 0) {
        this.selectedIndex = 0;
      } else {
        this.selectedIndex = null;
      }

      this.loading = false;
    },
    error: (err: HttpErrorResponse) => {
      this.loading = false;
      const detail =
        (err.error && (err.error.detail || err.error.message)) ||
        err.message ||
        'Failed to load courses';
      this.error =
        typeof detail === 'string'
          ? detail
          : 'Failed to load courses';
    },
  });

  }

  /** switch main tab (different course) */
  selectCourse(i: number): void {
    this.selectedIndex = i;
    this.selectedSubTab = 'theory'; // reset to theory when switching courses
  }

  /** switch sub-tab (theory or practical) */
  switchSubTab(tab: 'theory' | 'practical'): void {
    this.selectedSubTab = tab;
  }

  /** bottom Reset button */
  reset(): void {
    // You can decide what "reset" means.
    // For now:
    this.selectedIndex = this.courses.length ? 0 : null;
    this.selectedSubTab = 'theory';
  }
}
