import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import * as _ from 'lodash';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-head-to-head',
  templateUrl: './head-to-head.component.html',
  styleUrls: ['./head-to-head.component.scss']
})
export class HeadToHeadComponent {

  visible = false;
  user: any;
  matches: any[] = [];
  view = 'list';
  matchType = 'all';
  allMatches: any[] = [];
  fixturesLoading = false;
  matchResultModal = false;
  destroy$ = new Subject();
  teams: any[] = [];
  selectedMatch: any;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private messageService: MessageService,
    private title: Title
  ) { }

  ngOnInit(): void {
    this.fixturesLoading = true;
    this.view = localStorage.getItem('view') || 'list';
    this.authService.getCurrentUserDetail().subscribe(user => {
      this.user = user;
      this.getTeams();
      this.dataService.getUserMatches(this.user.uid).then(matches => {
        this.matches = matches;
        this.fixturesLoading = false;
        this.allMatches = _.cloneDeep(this.matches);
      })
    })

    this.title.setTitle('Cricket Head-to-Head (H2H) Records | Compare Teams & Players');
  }

  setMatchType(type: string) {
    this.matchType = type;
    if (type === 'all') {
      this.matches = this.allMatches;
      this.matches = this.matches.sort((a, b) => a.match_number - b.match_number);
    } else if (type === 'mymatches') {
      this.matches = this.allMatches.filter(match => match.team_one.id === this.user?.uid || match.team_two.id === this.user?.uid);
      this.matches = this.matches.sort((a, b) => a.match_number - b.match_number);
    } else {
      this.matches = this.allMatches.filter(match => match.status === type);
      this.matches = this.matches.sort((a, b) => a.match_number - b.match_number);
    }
  }

  createMatch() {
    this.visible = true;
  }

  closeModal() {
    this.visible = false;
  }

  getTeams() {
    this.dataService.getAllUsers().then((teams) => {
      this.teams = teams;
      this.fixturesLoading = false;
    });
  }

  getTeamDetails(team: any) {
    const teamData = this.teams.find((x) => x.uid === team?.id);
    team['name'] = teamData?.team?.name;
    team['logo'] = teamData?.team?.logo;
    // this.allMatches = JSON.parse(JSON.stringify(this.fixtures));
    this.allMatches = _.cloneDeep(this.matches);
    return teamData;
  }

  ballsToOvers(balls) {
    // Handle invalid inputs
    if (typeof balls !== 'number' || balls < 0) {
      return "Please provide a valid positive number of balls";
    }

    // Calculate complete overs and remaining balls
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;

    // Return formatted result
    if (remainingBalls === 0) {
      return `${overs}`;
    } else {
      return `${overs}.${remainingBalls}`;
    }
  }

  toggleView(view: string) {
    this.view = view;
    localStorage.setItem('view', view);
  }


  openMatchResultModal(match: any) {
    this.matchResultModal = true;
    this.selectedMatch = match;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  deleteMatch(match: any, e: Event) {
    e.stopPropagation();

    if (match.team_one?.id === this.user?.uid || this.user?.admin) {
      if (confirm(`Are you want to delete Match: ${match.match_number}`) === true) {
        this.dataService.deleteMatch(match.id);
        this.messageService.add({ severity: 'success', summary: 'Match', detail: 'Deleted Successfully!' });
      }
    } else {
      this.messageService.add({ severity: 'error', summary: 'League', detail: 'You are not authorized to delete this league!' });
      return;
    }
  }

  async closeMatchResultModal(match) {
    this.matchResultModal = false;
  }
}
