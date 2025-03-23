import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent {

  user: any
  constructor(
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUserDetail().subscribe(user => {
      console.log(user)
      this.user = user;
    })
  }
}
