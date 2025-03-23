import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  setupTeamVisible = false;
  isLoading = true;
  user: any;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.getCurrentUserDetail().subscribe(user => {
      this.user = user;
      this.isLoading = false;
    })
  }

  closeSetupTeamModal() {
    this.setupTeamVisible = false;
  }

  setupTeam() {
    this.setupTeamVisible = true;
  }

}
