import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'; // Add this import
import { RagChatbotService } from '../../services/ragchatbot.service';
import { NotificationService } from '../../services/notification.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {
  busy?: Subscription;
  _subscriptionsList: Array<Subscription> = [];
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  isSignupMode: boolean = false;
  passwordMismatch: boolean = false;
  isForgotPassword: boolean = false;
  forgotUsername: string = '';
  newPassword: string = '';
  grant_type: string = 'password';
  showForgotPassword: boolean = false;
  passwordErrors: string[] = [];
  newPasswordErrors: string[] = [];

  constructor(
    private ragChatbotService: RagChatbotService,
    private notificationService: NotificationService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnDestroy() {
    this._subscriptionsList.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  // API Call's
  CreateUser(): Subscription {
    // Extra: Prevent double submit, show loading, UX improvement
    if (!this.isSignupFormValid()) {
      this.notificationService.pop('error', 'Please fill all fields correctly.');
      return new Subscription();
    }
    this.busy = undefined;
    return this.ragChatbotService.create_user({
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.notificationService.pop('success', 'Account created! You can now log in.');
        // Optionally auto-login after signup:
        // this.LoginUser();
        this.isSignupMode = false;
        this.username = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this.passwordErrors = [];
        this.passwordMismatch = false;
      },
      error: (error) => {
        let msg = 'Error creating user';
        if (error?.error?.detail) {
          msg = error.error.detail;
        } else if (error?.error?.message) {
          msg = error.error.message;
        }
        this.notificationService.pop('error', msg);
        // Keep email for user convenience
        this.username = '';
        this.password = '';
        this.confirmPassword = '';
        this.passwordErrors = [];
        this.passwordMismatch = false;
      }
    });
  }

  LoginUser(): Subscription {
    return this.ragChatbotService.oauth_token({
      grant_type: this.grant_type,
      username: this.username,
      password: this.password
    }).subscribe({
      next: (response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('token_type', response.token_type);
        }
        this.username = '';
        this.password = '';
        this.notificationService.pop('success', "Login successful");
        // Poll for token and navigate when available
        const checkTokenAndNavigate = () => {
          if (localStorage.getItem('access_token')) {
            this.router.navigate(['/upload']);
          } else {
            setTimeout(checkTokenAndNavigate, 100); // Check again after 100ms
          }
        };
        checkTokenAndNavigate();
      },
      error: (error) => {
        this.username = '';
        this.password = '';
        this.notificationService.pop('error', "Login failed");
      }
    });
  }

  ForgotPassword(): Subscription {
    return this.ragChatbotService.forgot_password({
      identifier: this.forgotUsername,
      new_password: this.newPassword 
    }).subscribe({
      next: (response) => {
        this.notificationService.pop('success', "Password reset successful");
        this.forgotUsername = '';
        this.newPassword = '';
        this.showForgotPassword = false;
        this.isForgotPassword = false;
      },
      error: (error) => {
        this.notificationService.pop('error', "Error resetting password");
        this.forgotUsername = '';
        this.newPassword = '';
      }
    });
  }

  // Event Handlers

  onSignup(): void {
    // Prevent double submit
    if (this.busy) return;
    this._subscriptionsList.push((this.busy = this.CreateUser()));
  }

  onLogin(): void {
    this._subscriptionsList.push((this.busy = this.LoginUser()));
  }

  onForgotPassword(): void {
    this._subscriptionsList.push((this.busy = this.ForgotPassword()));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  backtoLogin(): void {
    this.isForgotPassword = false;
  }

  toggleSignupMode(event: Event): void {
    event.preventDefault();
    this.isSignupMode = !this.isSignupMode;
    this.username = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.showPassword = false;
    this.passwordMismatch = false;
    this.isForgotPassword = false;
    this.forgotUsername = '';
    this.newPassword = '';
    this.showForgotPassword = false;
  }

  showForgot(event: Event): void {
    event.preventDefault();
    this.isForgotPassword = true;
    this.username = '';
    this.password = '';
    this.showPassword = false;
  }

  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
  }
  
  validatePassword(password: string): string[] {
    const errors: string[] = [];
    
    // Check length (between 6-12)
    if (password.length < 6 || password.length > 12) {
      errors.push('Password must be between 6-12 characters');
    }
    
    // Check for invalid special characters (only @, _, . are allowed)
    const invalidChars = /[^a-zA-Z0-9@_.]/;
    if (invalidChars.test(password)) {
      errors.push('Only @, _, and . special characters are allowed');
    }
    
    // Check for at least 1 number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least 1 number');
    }
    
    // Check for at least 1 special character (@, _, .)
    if (!/[@_.]/.test(password)) {
      errors.push('Password must contain at least 1 special character (@, _, or .)');
    }
    
    // Check for at least 1 lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least 1 lowercase letter');
    }
    
    // Check for at least 1 uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least 1 uppercase letter');
    }
    
    return errors;
  }

  onPasswordChange(): void {
    this.passwordErrors = this.validatePassword(this.password);
    this.checkPasswordMatch();
  }

  onNewPasswordChange(): void {
    this.newPasswordErrors = this.validatePassword(this.newPassword);
  }

  checkPasswordMatch(): void {
    if (this.password && this.confirmPassword) {
      this.passwordMismatch = this.password !== this.confirmPassword;
    }
  }

  isPasswordValid(): boolean {
    return this.passwordErrors.length === 0 && this.password !== '';
  }

  isNewPasswordValid(): boolean {
    return this.newPasswordErrors.length === 0 && this.newPassword !== '';
  }

  isSignupFormValid(): boolean {
    return (
      this.username !== '' &&
      this.email !== '' &&
      this.password !== '' &&
      this.confirmPassword !== '' &&
      this.password === this.confirmPassword &&
      this.isPasswordValid()
    );
  }

  isForgotFormValid(): boolean {
    return (
      this.forgotUsername !== '' &&
      this.newPassword !== '' &&
      this.isNewPasswordValid()
    );
  }
}