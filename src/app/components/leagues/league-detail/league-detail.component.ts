import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MDCSnackbar } from '@material/snackbar';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-league-detail',
  templateUrl: './league-detail.component.html',
  styleUrls: ['./league-detail.component.scss'],
})
export class LeagueDetailComponent {
  league: any;
  leagueId: string;
  selectedTab: string = 'fixtures';
  user: any;
  teams: any[] = [];
  fixtures: any[] = [];
  matchResultModal = false;
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private dataService: DataService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.getCurrentUserDetail().subscribe((user) => {
      this.user = user;
    });

    this.leagueId = this.route.snapshot.paramMap.get('id');
    this.dataService.getLeagueDetails(this.leagueId).then((league) => {
      this.league = league;
      this.getTeams();
      console.log('league', this.league, this.user);
    });
  }

  copyToClipBoard() {
    try {
      const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
      snackbar.open();
      const text = (document.getElementById('copylink') as HTMLInputElement)
        .value;
      const input = document.createElement('input');
      input.setAttribute('value', String(text));
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setTimeout(() => snackbar.close(), 3000);
      return true;
    } catch (err) {
      return false;
    }
  }

  getTeams() {
    const teams = this.league.teams;
    console.log(teams);
    this.dataService.getUserTeams(teams).then((teams) => {
      this.teams = teams;
      console.log(this.teams);
    });
  }

  generateFixtures() {
    const teamIds = this.league.teams.map((team) => team);
    console.log(teamIds);
    const fixtures: any[] = [];
    const matchesPerPair = this.league.matchesPerPair;
    let matchNumber = 1;

    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        for (let k = 0; k < matchesPerPair; k++) {
          const homeTeam = k % 2 === 0 ? teamIds[i] : teamIds[j];
          const awayTeam = k % 2 === 0 ? teamIds[j] : teamIds[i];

          const fixture = {
            league_name: this.league.name,
            league_id: this.league.id,
            team_one: {
              id: homeTeam,
              runs: 24,
              wickets: 0,
              balls: 12,
            },
            team_two: {
              id: awayTeam,
              runs: 37,
              wickets: 0,
              balls: 10,
            },
            match_number: matchNumber++,
            status: 'upcoming',
          };

          fixtures.push(fixture);
          this.fixtures.push(fixture);
        }
      }
    }
    this.cd.detectChanges();

    console.log(fixtures);
  }

  getTeamDetails(team: any) {
    const teamData = this.teams.find((x) => x.id === team?.id);
    team['name'] = teamData?.team?.name;
    team['logo'] = teamData?.team?.logo;
    return teamData;
  }

  closeMatchResultModal() {
    this.matchResultModal = false;
  }

  openMatchResultModal(fixture: any) {
    this.matchResultModal = true;
    console.log(fixture, this.matchResultModal)
    this.cd.detectChanges();
    // this.getMatchDetail(fixture.match_id);
  }
}
