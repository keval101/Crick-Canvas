import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
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
  userId: string;
  destroy$ = new Subject();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dataService: DataService) {
    }

  ngOnInit() {

    this.authService.getCurrentUserDetail().subscribe(user => {
      this.getLeagues();
      console.log(user)
      this.userId = user.uid
    })
  }

  getLeagues() {
    this.dataService.getLeagues().pipe(takeUntil(this.destroy$)).subscribe(leagues => {
      console.log(leagues)
      this.leagues$.next(leagues)
    })
  }

  generateLeague() {
    this.visible = true;
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

  deleteLeague(league: any, e: Event) {
    e.stopPropagation();
    if(confirm(`Are you want to delete league ${league.name}`) === true) {
      this.dataService.deleteLeague(league.id);
      this.dataService.deleteLeagueMatches(league.id);
      this.getLeagues();
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
