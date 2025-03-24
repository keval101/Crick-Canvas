import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MDCSnackbar } from '@material/snackbar';
import { MessageService } from 'primeng/api';
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
  fixturesLoading = false;
  allMatches: any[] = [];
  matchType = 'all'
  selectedMatch: any;
  pointTable: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private dataService: DataService,
    private cd: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUserDetail().subscribe((user) => {
      this.user = user;
    });

    this.leagueId = this.route.snapshot.paramMap.get('id');
    this.getLeagueMatches()
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

  async generateFixtures() {
    this.fixturesLoading = true;
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
              runs: 0,
              wickets: 0,
              balls: 0,
            },
            team_two: {
              id: awayTeam,
              runs: 0,
              wickets: 0,
              balls: 0,
            },
            match_number: matchNumber++,
            status: 'upcoming',
          };

          fixtures.push(fixture);
        }
      }
    }
    
    await this.dataService.saveMatches(fixtures);
    this.messageService.add({ severity: 'success', summary: 'League', detail: 'Fixtures Generated Successfully!' });
    this.fixtures = fixtures;
    this.allMatches = JSON.parse(JSON.stringify(this.fixtures));
    this.fixturesLoading = false;
    this.cd.detectChanges();
  }

  getTeamDetails(team: any) {
    const teamData = this.teams.find((x) => x.id === team?.id);
    team['name'] = teamData?.team?.name;
    team['logo'] = teamData?.team?.logo;
    this.allMatches = JSON.parse(JSON.stringify(this.fixtures));
    return teamData;
  }

  getLeagueMatches() {
    this.dataService.getLeagueMatches(this.leagueId).subscribe((matches) => {
      this.fixtures = matches;
      this.allMatches = JSON.parse(JSON.stringify(this.fixtures));
      this.fixturesLoading = false;
      console.log(this.fixtures)
      this.cd.detectChanges();
    });
  }

  closeMatchResultModal() {
    this.matchResultModal = false;
    this.getLeagueMatches();
  }

  openMatchResultModal(fixture: any) {
    this.matchResultModal = true;
    this.selectedMatch = fixture;
    console.log(fixture, this.matchResultModal)
    this.cd.detectChanges();
  }

  searchMatches(e: Event): any {
    const searchText = (e.target as HTMLInputElement).value;
    if (!searchText) {
      this.fixtures = this.allMatches;
      return;
    }
  
    const lowerSearch = searchText.toLowerCase();
  
    this.fixtures = this.allMatches.filter(match => {
      const matchNumber = match.match_number?.toString().toLowerCase() || '';
      const teamOneName = match.team_one?.name?.toLowerCase() || '';
      const teamTwoName = match.team_two?.name?.toLowerCase() || '';
  
      console.log(matchNumber == lowerSearch)
      return (
        matchNumber == lowerSearch ||
        teamOneName.includes(lowerSearch) ||
        teamTwoName.includes(lowerSearch)
      );
    });
  }

  setMatchType(type: string) {
    this.matchType = type;
    if (type === 'all') {
      this.fixtures = this.allMatches;
    } else {
      this.fixtures = this.allMatches.filter(match => match.status === type);
    }
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

generatePointsTable() {
  const table: any = {};
  let pointTable = [];
  console.log(this.fixtures);

  for (const match of this.fixtures) {
    if(match?.team_one?.balls > 0 || match?.team_two?.balls > 0)  {
      const teams = [
        { team: match.team_one, opponent: match.team_two },
        { team: match.team_two, opponent: match.team_one }
      ];
  
      for (const { team, opponent } of teams) {
        if (!table[team.id]) {
          table[team.id] = {
            team: team.name,
            team_logo: team.logo,
            played: 0,
            win: 0,
            loss: 0,
            draw: 0,
            runsFor: 0,
            oversFacedBalls: 0,
            runsAgainst: 0,
            oversBowledBalls: 0,
          };
        }
  
        table[team.id].played++;
        table[team.id].runsFor += team.runs;
        table[team.id].oversFacedBalls += team.balls;
        table[team.id].runsAgainst += opponent.runs;
        table[team.id].oversBowledBalls += opponent.balls;
  
        // Win/Loss/Draw calculation
        if (match.status === 'completed') {
          if (team.runs > opponent.runs) {
            table[team.id].win++;
          } else if (team.runs < opponent.runs) {
            table[team.id].loss++;
          } else {
            table[team.id].draw++;
          }
        }
      }
    }
  
    // Finalize the points table with NRR, Pts, Win%
    this.pointTable = Object.values(table).map((team: any) => {
      const pts = (team.win * 2) + (team.draw * 1);
      const winPercent = team.played > 0 ? ((team.win / team.played) * 100).toFixed(0) : '0';
      const oversFaced = team.oversFacedBalls / 6;
      const oversBowled = team.oversBowledBalls / 6;
      const nrr = ((team.runsFor / oversFaced) - (team.runsAgainst / oversBowled)).toFixed(2);
  
      return {
        team: team.team,
        team_logo: team.team_logo,
        played: team.played,
        win: team.win,
        loss: team.loss,
        draw: team.draw,
        runsFor: team.runsFor,
        oversFaced: `${Math.floor(team.oversFacedBalls / 6)}.${team.oversFacedBalls % 6}`,
        runsAgainst: team.runsAgainst,
        oversBowled: `${Math.floor(team.oversBowledBalls / 6)}.${team.oversBowledBalls % 6}`,
        pts: pts,
        nrr: nrr,
        winPercentage: `${winPercent}%`
      };
    });

    }

    console.log('pointTable:', this.pointTable)
}


}
