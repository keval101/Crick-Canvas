import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'crickTracker';

  isLoginPage = false;
  hideSidebar = false;
  showSidebar = false;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if(window.innerWidth < 768) {
      this.showSidebar = false;
    }
  }

  constructor(
    private router: Router,
    public authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.themeService.initializeTheme();
    if(!this.authService.getCurrentUser()) {
      this.hideSidebar = true;
    }

    if(window.innerWidth < 768) {
      this.showSidebar = false;
    }

    this.authService.getCurrentUser().subscribe((res) => this.hideSidebar = res == null ? true : false )
  }

  checkForLoginPage() {
    this.isLoginPage = this.router.url.includes('/login') || this.router.url.includes('/signup');
    
    if(window.innerWidth < 768) {
      this.showSidebar = false;
    }
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }
}
