import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkTheme = 'dark';
  private lightTheme = 'light';
  constructor() { }

  toggleTheme(theme: string): void {
    if(theme ===  'default'){
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = "dark";
    }else{
      theme = "light";
    }}
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

  }

  initializeTheme(): void {
    setTimeout(() => {
      const savedTheme = localStorage.getItem('theme') || this.lightTheme;
      console.log('savedTheme', savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }, 500);
  }


}
