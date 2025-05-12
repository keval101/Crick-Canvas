import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MDCSnackbar } from '@material/snackbar';
import { MessageService } from 'primeng/api';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import * as _ from 'lodash';
import { Title } from '@angular/platform-browser';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
@Component({
  selector: 'app-league-detail',
  templateUrl: './league-detail.component.html',
  styleUrls: ['./league-detail.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        padding: '0',
        overflow: 'hidden',
      })),
      state('expanded', style({
        height: '*',
        overflow: 'hidden',
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class LeagueDetailComponent {
  destroy$ = new Subject();
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
  isPlayOffLoading = false;
  finalMatch: any;
  orangecap: any;
  purplecap: any;
  searchText: string = '';
  view = 'list';
  totalMatches = 0
  completedMatches = 0
  expandedRow: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private dataService: DataService,
    private cd: ChangeDetectorRef,
    private messageService: MessageService,
    private title: Title
  ) {}

  ngOnInit() {
    this.leagueId = this.route.snapshot.paramMap.get('id');

    this.dataService.getLeagueDetails(this.leagueId).then(async (league) => {
      this.league = league;
      this.title.setTitle(`${this.league.name} - League Details`);
      await this.getTeams();
    });
    this.title.setTitle(`League Details`);
    this.view = localStorage.getItem('view') || 'list';
    this.authService.getCurrentUserDetail().pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
    });

    this.getLeagueMatches()

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

  async getTeams() {
    const teams = this.league.teams;
    this.teams = await this.dataService.getUserTeams(teams)
  }

  async generateFixtures() {
    this.fixturesLoading = true;
    const teamIds = this.league.teams.map((team) => team);
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
    this.fixtures = this.fixtures.sort((a, b) => a.match_number - b.match_number);
    this.allMatches = _.cloneDeep(this.fixtures)
    this.fixturesLoading = false;
    this.cd.detectChanges();

  }

  getTeamDetails(team: any) {
    const teamData = this.teams.find((x) => x.id === team?.id);
    const dummyTeam = {
      id: teamData?.id ?? 'TBD',
      name: teamData?.team?.name ?? 'TBD',
      logo: teamData?.team?.logo ?? 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png',
      runs: 0,
      wickets: 0,
      balls: 0,
    }
    if(teamData) {
      team['name'] = teamData?.team?.name ?? 'TBD';
      team['logo'] = teamData?.team?.logo ?? 'https://i.postimg.cc/65sS9ZdX/pngwing-com.png';
      return teamData?.id ? teamData : dummyTeam;
    } else {
      return dummyTeam;
    }
  }

  getLeagueMatches() {
    this.dataService.getLeagueMatches(this.leagueId).pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe((matches) => {
      this.fixtures = matches.filter(match => match?.type != 'playoff');
      // this.fixtures = matches.filter(match => match?.status === 'completed');
      // this.fixtures = matches;
      this.fixtures = this.fixtures.sort((a, b) => a.match_number - b.match_number);
      this.playOffs = matches.filter(match => match?.type === 'playoff');
      this.playOffs = this.playOffs.length ? this.playOffs.sort((a, b) => a.rank - b.rank) : [];
      this.allMatches = _.cloneDeep(this.fixtures)
      this.fixturesLoading = false;
      this.totalMatches = this.allMatches.length;
      this.completedMatches = this.fixtures.filter(match => (match.status === 'completed' && match?.type != 'playoff') ).length;
      this.finalMatch = this.playOffs.find(m => m.id.includes('final'));

      this.cd.detectChanges();
    });
  }

  async closeMatchResultModal(match) {
    this.matchResultModal = false;
    // this.getLeagueMatches();

    const totalMatches = this.allMatches.length;
    const completedMatches = this.fixtures.filter(match => (match.status === 'completed' && match?.type != 'playoff') ).length;
    this.totalMatches = totalMatches;
    this.completedMatches = completedMatches;

    if(totalMatches == completedMatches) {
      if (match?.id?.includes('q1') && match.status === 'completed') {
        // Fetch the result of Qualifier 1
        const q1Match = this.playOffs.find(m => m.id.includes('q1'));
        const winner = q1Match.team_one.runs > q1Match.team_two.runs ? q1Match.team_one : q1Match.team_two;
        const loser = q1Match.team_one.runs > q1Match.team_two.runs ? q1Match.team_two : q1Match.team_one;

        // Update the Final with the winner of Q1
        const finalMatch = this.playOffs.find(m => m.id.includes('final'));
        if (finalMatch) {
          finalMatch.team_one = { ...winner };
        }

        // Update the Eliminator with the loser of Q1
        const q2Match = this.playOffs.find(m => m.id.includes('q2'));
        if (q2Match) {
          q2Match.team_one = { ...loser };
        }

        await this.dataService.updateMatchResult(finalMatch, finalMatch.id)
        await this.dataService.updateMatchResult(q2Match, q2Match.id)
      }


      if (match?.id?.includes('eliminator') && match.status === 'completed') {
        // Fetch the result of Qualifier 1
        const eliminatorMatch = this.playOffs.find(m => m.id.includes('eliminator'));
        const winner = eliminatorMatch.team_one.runs > eliminatorMatch.team_two.runs ? eliminatorMatch.team_one : eliminatorMatch.team_two;
        const loser = eliminatorMatch.team_one.runs > eliminatorMatch.team_two.runs ? eliminatorMatch.team_two : eliminatorMatch.team_one;

        // Update the Final with the winner of Q1
        const q2Match = this.playOffs.find(m => m.id.includes('q2'));
        if (q2Match) {
          q2Match.team_two = { ...winner };
        }
        await this.dataService.updateMatchResult(q2Match, q2Match.id)
      }

      
      if (match?.id?.includes('q2') && match.status === 'completed') {
        // Fetch the result of Qualifier 1
        const q2Match = this.playOffs.find(m => m.id.includes('q2'));
        const q2Winner = q2Match.team_one.runs > q2Match.team_two.runs ? q2Match.team_one : q2Match.team_two;
        
        // Update the Final with the Q2 winner
        const finalMatch = this.playOffs.find(m => m.id.includes('final'));
        if (finalMatch) {
          finalMatch.team_two = { ...q2Winner };
        }
        await this.dataService.updateMatchResult(finalMatch, finalMatch.id)
      }

      if (match?.id?.includes('final') && match.status === 'completed') {
        // Fetch the result of Qualifier 1
        const finalMatch = this.playOffs.find(m => m.id.includes('final'));
        const finalWinner = finalMatch.team_one.runs > finalMatch.team_two.runs ? finalMatch.team_one : finalMatch.team_two;
        const finalLoser = finalMatch.team_one.runs > finalMatch.team_two.runs ? finalMatch.team_two : finalMatch.team_one;
        finalMatch['runner-up'] = finalLoser;
        if(this.totalMatches === this.completedMatches) {
          this.league['orangecap'] = this.orangecap
          this.league['purplecap'] = this.purplecap
          this.league['winner'] = finalWinner
          this.dataService.updateLeague(this.league, this.league.id)
        }
        await this.dataService.updateMatchResult(finalMatch, finalMatch.id)
      }

    }
  }

  openMatchResultModal(fixture: any) {
    this.matchResultModal = true;
    this.selectedMatch = fixture;
    this.cd.detectChanges();
  }

  searchMatches(e: any, value?: string): any {
    const searchText = value ?? (e.target as HTMLInputElement).value;
    this.searchText = searchText;
    if (!searchText) {
      this.fixtures = this.allMatches;
      this.fixtures = this.fixtures.sort((a, b) => a.match_number - b.match_number);
      return;
    }
  
    const lowerSearch = searchText.toLowerCase();
  
    this.fixtures = this.allMatches.filter(match => {
      const matchNumber = match.match_number?.toString().toLowerCase() || '';
      const teamOneName = match.team_one?.name?.toLowerCase() || '';
      const teamTwoName = match.team_two?.name?.toLowerCase() || '';
  
      return (
        matchNumber == lowerSearch ||
        teamOneName.includes(lowerSearch) ||
        teamTwoName.includes(lowerSearch)
      );
    });

    this.fixtures = this.fixtures.sort((a, b) => a.match_number - b.match_number);

  }

  toggleView(view: string) {
    this.view = view;
    localStorage.setItem('view', view);
  }

  setMatchType(type: string) {
    this.matchType = type;
    if (type === 'all') {
      this.fixtures = this.allMatches;
      this.fixtures = this.fixtures.sort((a, b) => a.match_number - b.match_number);
    } else if(type === 'mymatches') {
      this.fixtures = this.allMatches.filter(match => match.team_one.id === this.user?.uid || match.team_two.id === this.user?.uid);
      this.fixtures = this.fixtures.sort((a, b) => a.match_number - b.match_number);
    } else {
      this.fixtures = this.allMatches.filter(match => match.status === type);
      this.fixtures = this.fixtures.sort((a, b) => a.match_number - b.match_number);
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

async generatePointsTable() {
  const table: any = {};
  let pointTable = [];


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
          wicketsTaken: 0,
          wicketsFallen: 0,
          oversFacedBalls: 0,
          runsAgainst: 0,
          oversBowledBalls: 0,
          matches: []
        };
      }

      if (match?.team_one?.balls > 0 || match?.team_two?.balls > 0) {
        table[team.id].played++;
        table[team.id].matches.push(match);
      }
      table[team.id].runsFor += team.runs;
      table[team.id].oversFacedBalls += team.balls;
      table[team.id].runsAgainst += opponent.runs;
      table[team.id].oversBowledBalls += opponent.balls;
      table[team.id].wicketsTaken += opponent.wickets;
      table[team.id].wicketsFallen += team.wickets;

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
  pointTable = await Promise.all(
    Object.values(table).map(async (team: any) => {
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
        wicketsTaken: +team.wicketsTaken,
        wicketsFallen: +team.wicketsFallen,
        oversFaced: `${Math.floor(team.oversFacedBalls / 6)}.${team.oversFacedBalls % 6}`,
        runsAgainst: team.runsAgainst,
        oversBowled: `${Math.floor(team.oversBowledBalls / 6)}.${team.oversBowledBalls % 6}`,
        pts: +pts,
        nrr: isNaN(+nrr) ? 0 : nrr,
        winPercentage: `${winPercent}%`,
        matches: team.matches,
      };
    })
  );

  this.orangecap = pointTable.sort((a, b) => b.runsFor - a.runsFor)[0];
  this.purplecap = pointTable.sort((a, b) => {
  if (a.wicketsTaken === b.wicketsTaken) {
    const economyA = this.calculateEconomy(a.runsAgainst, a.oversBowled);
    const economyB = this.calculateEconomy(b.runsAgainst, b.oversBowled);
    return economyA - economyB;
  } else {
    return b.wicketsTaken - a.wicketsTaken
  }
  })[0];

  pointTable.map((team, index) => {
    if(team.matches.length) {
      team['matches'] = team.matches.sort((a, b) => b.date - a.date);
    }
  })
  
  this.pointTable = await this.sortPointsTable(pointTable);
  const pointsTable = _.cloneDeep(this.pointTable);
  // await Promise.all(
  //   pointsTable.map(async (team) => {
  //     delete team.team_logo;
  //     delete team.nrr;
  //     delete team.pts;
  //     delete team.winPercentage;
  //     // delete team.matches;
  
  //     team.matches = team.matches.sort((a, b) => b.date - a.date);
  //     team.matches.length = team.matches.length > 5 ? 5 : team.matches.length;
  //     team.matches = team.matches.map((match) => {
    
  //       // find win, lost or draw
  //       if(match.team_one.id === team.id) {
  //         if(match.team_one.runs > match.team_two.runs) {
  //           return 'W'
  //         } else if(match.team_one.runs < match.team_two.runs) {
  //           return 'L'
  //         } else {
  //           return 'D'
  //         }
  //       } else {
  //         if(match.team_two.runs > match.team_one.runs) {
  //           return 'W'
  //         } else if(match.team_two.runs < match.team_one.runs) {
  //           return 'L'
  //         } else {
  //           return 'D'
  //         }
  //       }
  //     })
  //     delete team.team_logo;
  //     delete team.nrr;
  //     delete team.pts;
  //     delete team.winPercentage;
    
  //     await this.dataService.storePlayerPerformance(this.league.id, team.id, team);
  //     console.log('team', team)
  //   })
  // );

  if(this.totalMatches === this.completedMatches) {
    this.league['orangecap'] = this.orangecap
    this.league['purplecap'] = this.purplecap
    this.dataService.updateLeague(this.league, this.league.id)
  }
}

calculateNRR(runsFor: number, oversFaced: number, runsAgainst: number, oversBowled: number): number {
  if (oversFaced > 0 && oversBowled > 0) {
    const nrr = (runsFor / (oversFaced / 6)) - (runsAgainst / (oversBowled / 6));
    return parseFloat(nrr.toFixed(3));
  } else {
    return 0;
  }
}

calculateEconomy(runsConceded: number, ballsBowled: number): number {
  if (ballsBowled === 0) {
    return 0; // Avoid division by zero
  }
  const oversBowled = ballsBowled; // Convert balls to overs
  return (runsConceded / oversBowled); // Round to 2 decimal places
}

  async generatePlayOffs() {
    this.isPlayOffLoading = true;
    await this.generatePointsTable();
    const sortedTable = this.sortPointsTable(this.pointTable);
    const totalMatches = this.allMatches.length;
    const completedMatches = this.fixtures.filter(match => (match.status === 'completed' && match?.type != 'playoff') ).length;
    this.completedMatches = completedMatches
    this.totalMatches = totalMatches
    if(!this.playOffs.length) {
      setTimeout(async () => {
        if(this.playOffs.length === 0) {
          if(completedMatches == totalMatches && sortedTable.length) {
            // https://i.postimg.cc/65sS9ZdX/pngwing-com.png
            this.playOffs = [
              {
                league_name: this.league.name,
                status: "upcoming",
                team_one: {
                  balls: 0,
                  id: sortedTable[0].id,
                  name: sortedTable[0].team,
                  runs: 0,
                  wickets: 0
                },
                league_id: this.league.id,
                match_number: 'Qualifier 1',
                team_two: {
                  balls: 0,
                  id: sortedTable[1].id,
                  name: sortedTable[1].team,
                  runs: 0,
                  wickets: 0
                },
                id: `${this.league.id}_q1`,
                type: 'playoff',
                rank: 1
              },
              {
                league_name: this.league.name,
                status: "upcoming",
                team_one: {
                  balls: 0,
                  id: sortedTable[2].id,
                  name: sortedTable[2].team,
                  runs: 0,
                  wickets: 0
                },
                league_id: this.league.id,
                match_number: 'Eliminator',
                team_two: {
                  balls: 0,
                  id: sortedTable[3].id,
                  name: sortedTable[3].team,
                  runs: 0,
                  wickets: 0
                },
                id: `${this.league.id}_eliminator`,
                type: 'playoff',
                rank: 2
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
                id: `${this.league.id}_q2`,
                type: 'playoff',
                rank: 3
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
                id: `${this.league.id}_final`,
                type: 'playoff',
                rank: 4
              },
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
                id: `${this.league.id}_q1`,
                type: 'playoff',
                rank: 1
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
                id: `${this.league.id}_eliminator`,
                type: 'playoff',
                rank: 2
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
                id: `${this.league.id}_q2`,
                type: 'playoff',
                rank: 3
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
                id: `${this.league.id}_final`,
                type: 'playoff',
                rank: 4
              },
            ]
          }
  
          this.playOffs = this.playOffs.sort((a, b) => a.rank - b.rank);
          await this.dataService.saveMatches(this.playOffs);
          this.isPlayOffLoading = false;
          this.messageService.add({ severity: 'success', summary: 'League', detail: 'Playoffs Generated Successfully!' });
        }
        this.cd.detectChanges();
      }, 1000);
    } else {
      if(this.playOffs[0].team_one.id === '') {
        if(completedMatches == totalMatches && sortedTable.length) {
          // https://i.postimg.cc/65sS9ZdX/pngwing-com.png
          this.playOffs = [
            {
              league_name: this.league.name,
              status: "upcoming",
              team_one: {
                balls: 0,
                id: sortedTable[0].id,
                name: sortedTable[0].team,
                runs: 0,
                logo: sortedTable[0].team_logo,
                wickets: 0
              },
              league_id: this.league.id,
              match_number: 'Qualifier 1',
              team_two: {
                balls: 0,
                id: sortedTable[1].id,
                name: sortedTable[1].team,
                runs: 0,
                logo: sortedTable[1].team_logo,
                wickets: 0
              },
              id: `${this.league.id}_q1`,
              type: 'playoff',
              rank: 1
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
              id: `${this.league.id}_eliminator`,
              type: 'playoff',
              rank: 2
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
              id: `${this.league.id}_q2`,
              type: 'playoff',
              rank: 3
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
              id: `${this.league.id}_final`,
              type: 'playoff',
              rank: 4
            },
          ]
        }

        this.playOffs = this.playOffs.sort((a, b) => a.rank - b.rank);
        await this.dataService.saveMatches(this.playOffs);
        this.isPlayOffLoading = false;
        this.messageService.add({ severity: 'success', summary: 'League', detail: 'Playoffs Generated Successfully!' });
      } else {
        this.isPlayOffLoading = false;
      }
    }
  }

  sortPointsTable(pointsTable: any[]) {
    return pointsTable.sort((a, b) => {
      if (b.pts === a.pts) {
        return b.nrr - a.nrr; // Sort by NRR if points are equal
      }
      return b.pts - a.pts; // Otherwise sort by points
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  toggleExpand(index: number) {
    this.expandedRow = this.expandedRow === index ? null : index;
  }

  getDate(timestamp) {
    const date = new Date(timestamp);
    return date;
  }

  trackById(index: number, item: any): number {
    return item.id ?? item.team;
  }

}
