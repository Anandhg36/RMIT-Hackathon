import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AuthService } from 'src/app/authservice';

const API_BASE = 'http://localhost:8010';

/** ---------- API response types ---------- */

// /users/{userId}/courses
interface CourseApi {
  id: number | string;            // backend "course_id" mapped to "id"
  name: string;                   // backend "course_name"
  course_code?: string;
  created_at?: string;
  start_at?: string;
  end_at?: string;
  apply_assignment_group_weights?: boolean;
}

// /find_classmate_now?user_id=...
// when we DO have classmates:
interface MatchRow {
  user_id: number;
  user_name: string;
  course_id: number | string;
  day: string;
  time: string;
  room: string;
  course_name: string;
  is_theory: boolean;
}

// when we DON'T have classmates but still have timetable info:
interface NoMatchRow {
  course_id: number | string;
  day_of_course: string;
  time_of_day: string;
  room_of_course: string;
  is_theory: boolean;
  course_name?: string;
}

interface ClassmateApiResponse {
  message: string;
  count: number;
  data_match: MatchRow[];
  data_no_match: NoMatchRow[];
}

/** ---------- Frontend view model ---------- */

interface SessionInfo {
  day: string;
  time: string;
  classroom: string;
  students: {
    user_id: number;
    name: string;
  }[];
}

export interface CourseVM {
  id: number | string;
  name: string;
  course_code?: string;
  created_at?: string;
  start_at?: string;
  end_at?: string;
  apply_assignment_group_weights?: boolean;

  theory: SessionInfo;
  practical: SessionInfo;
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
  private auth = inject(AuthService);

  TAB_WIDTH = 260;

  loading = true;
  error: string | null = null;

  courses: CourseVM[] = [];
  selectedIndex: number | null = null;
  selectedSubTab: 'theory' | 'practical' = 'theory';

  // ✅ helper getter so template can safely read current course
  get currentCourse(): CourseVM | null {
    if (this.selectedIndex === null) return null;
    return this.courses[this.selectedIndex] ?? null;
  }

  private get userId(): number {
    const saved = this.auth.getUserId();
    return saved ? Number(saved) : 4190959;
  }

  ngOnInit(): void {
    this.fetchAllData();
  }

  /**
   * 1. GET /users/{id}/courses
   * 2. GET /find_classmate_now?user_id={id}
   * 3. Merge them into one `courses` array for the template.
   */
  fetchAllData(): void {
    this.loading = true;
    this.error = null;

    const coursesReq = this.http.get<CourseApi[]>(
      `${API_BASE}/users/${this.userId}/courses`
    );

    const classmatesReq = this.http.get<ClassmateApiResponse>(
      `${API_BASE}/find_classmate_now`,
      {
        params: { user_id: this.userId },
      }
    );

    forkJoin([coursesReq, classmatesReq]).subscribe({
      next: ([coursesApi, classmatesApi]) => {
        // 1. only active courses (your earlier rule)
        const activeCourses = (coursesApi ?? []).filter(
          (c) => c.end_at != null
        );

        // 2. map of course_id -> CourseVM
        const courseMap: Record<string | number, CourseVM> = {};

        const ensureCourseVm = (
          course_id: string | number,
          fallbackName?: string
        ): CourseVM => {
          if (!courseMap[course_id]) {
            const fromCourses = activeCourses.find((c) => c.id === course_id);

            courseMap[course_id] = {
              id: course_id,
              name:
                fromCourses?.name ||
                fallbackName ||
                `Course ${course_id}`,
              course_code: fromCourses?.course_code,
              created_at: fromCourses?.created_at,
              start_at: fromCourses?.start_at,
              end_at: fromCourses?.end_at,
              apply_assignment_group_weights:
                fromCourses?.apply_assignment_group_weights,
              theory: {
                day: '',
                time: '',
                classroom: '',
                students: [],
              },
              practical: {
                day: '',
                time: '',
                classroom: '',
                students: [],
              },
            };
          }
          return courseMap[course_id];
        };

        // 3. fill from data_match (classmates present)
        for (const row of classmatesApi.data_match ?? []) {
          const cid = row.course_id;
          const vm = ensureCourseVm(cid, row.course_name);

          const bucket = row.is_theory ? vm.theory : vm.practical;

          if (!bucket.day) bucket.day = row.day || '';
          if (!bucket.time) bucket.time = row.time || '';
          if (!bucket.classroom) bucket.classroom = row.room || '';

          bucket.students.push({
            user_id: row.user_id,
            name: row.user_name,
          });
        }

        // 4. fill from data_no_match (no classmates but timetable info)
        for (const row of classmatesApi.data_no_match ?? []) {
          const cid = row.course_id;
          const vm = ensureCourseVm(cid, row.course_name);

          const bucket = row.is_theory ? vm.theory : vm.practical;

          if (!bucket.day) bucket.day = row.day_of_course || '';
          if (!bucket.time) bucket.time = row.time_of_day || '';
          if (!bucket.classroom) bucket.classroom = row.room_of_course || '';
          // no students added here
        }

        // 5. final courses array
        this.courses = Object.values(courseMap);

        // 6. default selection
        this.selectedIndex = this.courses.length > 0 ? 0 : null;
        this.selectedSubTab = 'theory';

        this.loading = false;
      },

      error: (err: HttpErrorResponse) => {
        this.loading = false;

        const detail =
          (err.error && (err.error.detail || err.error.message)) ||
          err.message ||
          'Failed to load data';

        this.error =
          typeof detail === 'string' ? detail : 'Failed to load data';
      },
    });
  }

  /** click on a course tab */
  selectCourse(i: number): void {
    this.selectedIndex = i;
    this.selectedSubTab = 'theory';
  }

  /** click Theory / Practical toggle */
  switchSubTab(tab: 'theory' | 'practical'): void {
    this.selectedSubTab = tab;
  }

  reset(): void {
    this.selectedIndex = this.courses.length ? 0 : null;
    this.selectedSubTab = 'theory';
  }
}
