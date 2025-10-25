import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/authservice'; // make sure this path matches your project

// TODO: move this to environment.ts later
const API_BASE = 'http://localhost:8010';

// Shape of what the backend returns from /login
interface LoginResponse {
  user_id: number;
  message?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  loading = false;
  error: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

  ngOnInit(): void {
    // Autofill saved email if "remember me" was used
    const saved = localStorage.getItem('auth_email');
    if (saved) {
      this.form.patchValue({ email: saved, remember: true });
    }
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // pull values safely
    const email = (this.f.email.value ?? '').trim();
    const password = this.f.password.value ?? '';
    const remember = !!this.form.value.remember;

    // build query params because your backend expects them that way
    const params = new HttpParams()
      .set('email', email)
      .set('password', password);

    this.loading = true;

    this.http
      .post<LoginResponse>(`${API_BASE}/login`, null, { params })
      .subscribe({
        next: (resp) => {
          this.loading = false;

          // store remembered email for next visit (UI autofill convenience)
          if (remember) {
            localStorage.setItem('auth_email', email);
          } else {
            localStorage.removeItem('auth_email');
          }

          // defensive check: make sure backend actually sent user_id
          if (resp && typeof resp.user_id === 'number') {
            this.auth.setUserId(resp.user_id); // <--- global user ID
          } else {
            // backend didn't return what we expected
            this.error = 'Login succeeded but user_id was not returned.';
            return;
          }
          
          this.router.navigateByUrl('/dashboard');
        },

        error: (err: HttpErrorResponse) => {
          this.loading = false;

          const detail =
            (err.error && (err.error.detail || err.error.message)) ||
            err.message ||
            'Login failed';

          this.error =
            typeof detail === 'string' ? detail : 'Login failed';
        },
      });
  }
}
