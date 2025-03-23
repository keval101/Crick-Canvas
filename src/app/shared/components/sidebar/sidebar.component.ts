import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  userId: string;
  navigations = [
    {
      name: 'Dashboard',
      route: 'dashboard',
      icon: '/assets/icons/dashboard.svg'
    },
    {
      name: 'Account',
      route: 'account',
      icon: '/assets/icons/account.svg'
    },
    {
      name: 'Trades',
      route: 'trades',
      icon: '/assets/icons/swap.svg'
    },
    {
      name: 'Sheet',
      route: 'sheet',
      icon: '/assets/icons/sheet.svg'
    },
    {
      name: 'Analytics',
      route: 'analytics',
      icon: '/assets/icons/analytics.svg'
    },
    {
      name: 'Market Holidays',
      route: 'market-holidays',
      icon: '/assets/icons/sleeping-facecom.svg'
    }
  ]

  constructor(
    private authService: AuthService,
    private router: Router) {
      this.authService.getCurrentUserDetail().subscribe(user => {
        this.userId = user.uid
      })
    }

  signOut() {
    this.authService.signOut();
    this.router.navigate(['/login'])
  }
}
