import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'crickTracker';

  isLoginPage = false;

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  checkForLoginPage() {
    this.isLoginPage = this.router.url.includes('/login') || this.router.url.includes('/signup');
  }
}
