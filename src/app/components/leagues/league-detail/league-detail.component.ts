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
  fixturesLoading = true;
  allMatches: any[] = [];
  matchType = 'all'
  selectedMatch: any;
  pointTable: any[] = [];
  playOffs: any[] = [];

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
      console.log(this.user)
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
      this.fixturesLoading = false;
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

    console.log(fixtures);
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
      const teams = [
        { team: match.team_one, opponent: match.team_two },
        { team: match.team_two, opponent: match.team_one }
      ];
  
      for (const { team, opponent } of teams) {
        if (!table[team.id]) {
          table[team.id] = {
            id: team.id,
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
  
        if(match?.team_one?.balls > 0 || match?.team_two?.balls > 0) {
          table[team.id].played++;
        }
        table[team.id].runsFor += team.runs;
        table[team.id].oversFacedBalls += opponent.balls;
        table[team.id].runsAgainst += opponent.runs;
        table[team.id].oversBowledBalls += team.balls;
  
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
    pointTable = Object.values(table).map((team: any) => {
      const pts = (team.win * 2) + (team.draw * 1);
      const winPercent = team.played > 0 ? ((team.win / team.played) * 100).toFixed(0) : '0';
      const oversFaced = team.oversFacedBalls / 6;
      const oversBowled = team.oversBowledBalls / 6;
      const nrr = this.calculateNRR(team.runsFor, team.oversFacedBalls, team.runsAgainst, team.oversBowledBalls);
  
      return {
        id: team.id,
        team: team.team,
        team_logo: team.team_logo,
        played: +team.played,
        win: +team.win,
        loss: +team.loss,
        draw: +team.draw,
        runsFor: +team.runsFor,
        oversFaced: `${Math.floor(team.oversFacedBalls / 6)}.${team.oversFacedBalls % 6}`,
        runsAgainst: team.runsAgainst,
        oversBowled: `${Math.floor(team.oversBowledBalls / 6)}.${team.oversBowledBalls % 6}`,
        pts: +pts,
        nrr: isNaN(+nrr) ? 0 : nrr,
        winPercentage: `${winPercent}%`
      };
    });

    this.pointTable = this.sortPointsTable(pointTable);
    console.log('pointTable:', this.pointTable)
}

calculateNRR(runsFor: number, oversFaced: number, runsAgainst: number, oversBowled: number): number {
  console.log(runsFor, oversFaced, runsAgainst, oversBowled)
  if (oversFaced > 0 && oversBowled > 0) {
    const nrr = (runsFor / (oversFaced / 6)) - (runsAgainst / (oversBowled / 6));
    return parseFloat(nrr.toFixed(3));
  } else {
    return 0;
  }
}

  generatePlayOffs() {
    this.generatePointsTable();
    const sortedTable = this.sortPointsTable(this.pointTable);
    const totalMatches = this.fixtures.length;
    const completedMatches = this.fixtures.filter(match => match.status === 'completed').length;
    
    setTimeout(() => {
      if(sortedTable.length) {
        console.log(sortedTable[0], sortedTable[1], sortedTable[2], sortedTable[3])
      }
      if(!this.playOffs.length) {
        if(completedMatches == totalMatches && sortedTable.length) {
          // https://i.postimg.cc/65sS9ZdX/pngwing-com.png;
          this.playOffs = [
            {
              league_name: this.league.name,
              status: "upcoming",
              team_one: {
                balls: 0,
                id: sortedTable[0].id,
                name: sortedTable[0].name,
                runs: 0,
                logo: sortedTable[0].team_logo,
                wickets: 0
              },
              league_id: this.league.id,
              match_number: 'Qualifier 1',
              team_two: {
                balls: 0,
                id: sortedTable[1].id,
                name: sortedTable[1].name,
                runs: 0,
                logo: sortedTable[1].team_logo,
                wickets: 0
              },
              id: `${this.league.id}_q1`
            },
            {
              league_name: this.league.name,
              status: "upcoming",
              team_one: {
                balls: 0,
                id: sortedTable[2].id,
                name: sortedTable[2].team,
                runs: 0,
                logo: sortedTable[2].team_logo,
                wickets: 0
              },
              league_id: this.league.id,
              match_number: 'Eliminator',
              team_two: {
                balls: 0,
                id: sortedTable[3].id,
                name: sortedTable[3].team,
                runs: 0,
                logo: sortedTable[3].team_logo,
                wickets: 0
              },
              id: `${this.league.id}_eliminator`
            },
            {
              league_name: this.league.name,
              status: "upcoming",
              team_one: {
                balls: 0,
                id: '',
                name: 'TBD',
                runs: 0,
                logo: 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
                wickets: 0
              },
              league_id: this.league.id,
              match_number: 'Qualifier 2',
              team_two: {
                balls: 0,
                id: '',
                name: 'TBD',
                runs: 0,
                logo: 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
                wickets: 0
              },
              id: `${this.league.id}_q2`
            },
            {
              league_name: this.league.name,
              status: "upcoming",
              team_one: {
                balls: 0,
                id: '',
                name: 'TBD',
                runs: 0,
                logo: 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
                wickets: 0
              },
              league_id: this.league.id,
              match_number: 'Final',
              team_two: {
                balls: 0,
                id: '',
                name: 'TBD',
                runs: 0,
                logo: 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
                wickets: 0
              },
              id: `${this.league.id}_final`
            }
          ]
        } else {
          this.playOffs = [
            {
              league_name: this.league.name,
              status: "upcoming",
              team_one: {
                balls: 0,
                id: '',
                name: 'TBD',
                runs: 0,
                logo: 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
                wickets: 0
              },
              league_id: this.league.id,
              match_number: 'Qualifier 1',
              team_two: {
                balls: 0,
                id: '',
                name: 'TBD',
                runs: 0,
                logo: 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
                wickets: 0
              },
              id: `${this.league.id}_q1`
            },
            {
              league_name: this.league.name,
              status: "upcoming",
              team_one: {
                balls: 0,
                id: '',
                name: 'TBD',
                runs: 0,
                logo: 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
                wickets: 0
              },
              league_id: this.league.id,
              match_number: 'Eliminator',
              team_two: {
                balls: 0,
                id: '',
                name: 'TBD',
                runs: 0,
                logo: 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
                wickets: 0
              },
              id: `${this.league.id}_eliminator`
            },
          ]
        }
      }
      console.log('playOffs', this.playOffs)
      this.cd.detectChanges();
    }, 1000);

  }

  sortPointsTable(pointsTable: any[]) {
    return pointsTable.sort((a, b) => {
      if (b.pts === a.pts) {
        return b.nrr - a.nrr; // Sort by NRR if points are equal
      }
      return b.pts - a.pts; // Otherwise sort by points
    });
  }


}
