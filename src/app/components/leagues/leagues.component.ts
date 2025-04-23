import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
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
  user: any;
  isLeagueLoading = true;
  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private authService: AuthService,
    private title: Title,
    private dataService: DataService) {
    }

  ngOnInit() {

    this.authService.getCurrentUserDetail().subscribe(user => {
      this.getLeagues();
      this.user = user;
      this.userId = user.uid
    })

    this.title.setTitle('Leagues Overview | Fixtures, Results & Standings');
  }

  getLeagues() {
    this.isLeagueLoading = true;
    this.dataService.getLeagues().pipe(takeUntil(this.destroy$)).subscribe(leagues => {
      // by timestamp
      let sortedLeagues = leagues.sort((a, b) => b.id - a.id);
      this.leagues$.next(sortedLeagues)
      this.isLeagueLoading = false;
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

    if(league.userId === this.userId || this.user?.admin) {
      if(confirm(`Are you want to delete league ${league.name}`) === true) {
        this.dataService.deleteLeague(league.id);
        this.dataService.deleteLeagueMatches(league.id);
        this.messageService.add({ severity: 'success', summary: 'League', detail: 'Deleted Successfully!' });
        this.getLeagues();
      }
    } else {
      this.messageService.add({ severity: 'error', summary: 'League', detail: 'You are not authorized to delete this league!' });
      return;
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
