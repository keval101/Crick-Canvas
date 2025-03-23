import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-leagues',
  templateUrl: './leagues.component.html',
  styleUrls: ['./leagues.component.scss']
})
export class LeaguesComponent {
  visible = false;
  setupTeamVisible = false;
  form!: FormGroup;
  leagues$ = new BehaviorSubject([]);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dataService: DataService) {
      this.dataService.getLeagues().then(leagues => {
        this.leagues$.next(leagues)
        console.log(leagues)
      })
    }

  generateLeague() {
    this.visible = true;
    this.authService.getCurrentUser().subscribe(user => {
      console.log(user.uid)
      console.log(localStorage.getItem('userId'))
    })
  }

  closeModal() {
    this.visible = false;
  }

  closeSetupTeamModal() {
    this.setupTeamVisible = false;
  }

  joinLeague() {
    this.setupTeamVisible = true;
  }

  getDateFormat(date: any) {
    let formateDate = date.split('/');
    formateDate = formateDate[2] + '-' + formateDate[1] + '-' + formateDate[0];
    return new Date(formateDate).toDateString();
  }
}
