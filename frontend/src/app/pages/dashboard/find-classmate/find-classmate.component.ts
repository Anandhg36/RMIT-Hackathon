import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'src/app/authservice';

// Your backend base URL
const API_BASE = 'http://localhost:8010';

// --- What we get back from /users/:id/courses ---
interface CourseApi {
  id: number | string;
  name: string;
  course_code: string;
  created_at?: string;
  start_at?: string;
  end_at?: string;
  apply_assignment_group_weights?: boolean;
}


// --- What we show/edit in the UI ---
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

// --- What /find_classmate expects per entry ---
interface ClassmateRequest {
  is_theory: boolean;
  course_id: number | string;
  day_of_course: string;
  time_of_day: string;
  room_of_course: string;
  user_id: number;
}

@Component({
  selector: 'app-find-classmate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './find-classmate.component.html',
  styleUrls: ['./find-classmate.component.css'],
})
export class FindClassmateComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  
  loading = true;
  error: string | null = null;
  courses: CourseVM[] = [];

   private get userId(): number {
     const saved = this.auth.getUserId();
     return saved ? Number(saved) : 4190959;
  }

  // Days of week for the dropdowns
  readonly daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  ngOnInit(): void {
    this.fetchCourses();
  }

  /**
   * 1. Load the user's courses from backend
   * 2. Add empty theory/practical fields so the form can bind
   */
  fetchCourses(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<CourseApi[]>(`${API_BASE}/users/${this.userId}/courses`)
      .subscribe({
        next: (apiCourses) => {
          this.courses = (apiCourses ?? []).map((c) => ({
            ...c,
            theory: { day: '', time: '', classroom: '' },
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
          this.error =
            typeof detail === 'string' ? detail : 'Failed to load courses';
        },
      });
  }

  private theoryIsComplete(course: CourseVM): boolean {
    return (
      !!course.theory.day?.trim() &&
      !!course.theory.time?.trim() &&
      !!course.theory.classroom?.trim()
    );
  }

  private practicalIsComplete(course: CourseVM): boolean {
    const { day, time, classroom } = course.practical;

    const anyFilled =
      !!day?.trim() || !!time?.trim() || !!classroom?.trim();

    const allFilled =
      !!day?.trim() && !!time?.trim() && !!classroom?.trim();

    return !anyFilled || allFilled;
  }

  private buildFindClassmatePayload(): ClassmateRequest[] {
    const out: ClassmateRequest[] = [];

    for (const course of this.courses) {
      if (!course.end_at) continue;
      out.push({
        is_theory: true,
        course_id: course.id,
        day_of_course: course.theory.day.trim(),
        time_of_day: course.theory.time.trim(),
        room_of_course: course.theory.classroom.trim(),
        user_id: this.userId,
      });

      // PRACTICAL block (optional)
      const p = course.practical;
      const practicalAllFilled =
        !!p.day?.trim() && !!p.time?.trim() && !!p.classroom?.trim();

      if (practicalAllFilled) {
        out.push({
          is_theory: false,
          course_id: course.id,
          day_of_course: p.day.trim(),
          time_of_day: p.time.trim(),
          room_of_course: p.classroom.trim(),
          user_id: this.userId,
        });
      }
    }

    return out;
  }

  /**
   * Called when user clicks Save.
   * Steps:
   * 1. Check theory fields are filled for EVERY shown course.
   * 2. Check practical blocks aren't half-filled.
   * 3. Build payload.
   * 4. POST the array to /find_classmate.
   */
  saveDetails(): void {
    const badTheory = this.courses.some(
      (course) => course.end_at && !this.theoryIsComplete(course)
    );
    if (badTheory) {
      alert(
        'Please fill ALL Theory fields (Day, Time, Classroom) for each course.'
      );
      return;
    }

    const badPractical = this.courses.some(
      (course) => course.end_at && !this.practicalIsComplete(course)
    );
    if (badPractical) {
      alert(
        'If you start filling Practical for a course, please fill Day, Time AND Classroom.'
      );
      return;
    }

    const payload = this.buildFindClassmatePayload();

    if (payload.length === 0) {
      alert('Nothing to submit.');
      return;
    }


    this.loading = true;
    this.error = null;

    this.http.post(`${API_BASE}/find_classmate`, payload).subscribe({
      next: (resp) => {
        this.loading = false;
        console.log('Server response:', resp);
        alert('Submitted! Check console for server response.');
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        console.error('Submit error:', err);

        const detail =
          (err.error && (err.error.detail || err.error.message)) ||
          err.message ||
          'Submission failed';

        this.error =
          typeof detail === 'string' ? detail : 'Submission failed';

        alert('Error: ' + this.error);
      },
    });
  }
}
