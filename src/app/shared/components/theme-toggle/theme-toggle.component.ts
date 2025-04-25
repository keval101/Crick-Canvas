import { Component } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss']
})
export class ThemeToggleComponent {
  isDarkMode: boolean = false;

  constructor(private themeService: ThemeService) {
    setTimeout(() => {
      this.isDarkMode = localStorage.getItem('theme') === 'dark';
    }, 100);
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.toggleTheme(this.isDarkMode ? 'dark' : 'light');
  }
}
