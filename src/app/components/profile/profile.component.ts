import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

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
