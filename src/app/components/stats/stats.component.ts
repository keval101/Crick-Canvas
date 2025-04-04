import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent {

  user: any;
  playerId: any;
  stats: any;
  isLoading = true;
  finalTitles: any[] = [];
  runnerUpTitles: any[] = [];
  participatedLeagues: any[] = [];
  orangecap: any[] = [];
  purplecap: any[] = [];
  destroy$ = new Subject();
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private dataService: DataService
  ) { }

  ngOnInit(): void {

    this.playerId = this.route.snapshot.paramMap.get('userId');
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.isLoading = true;
      this.finalTitles = [];
      this.runnerUpTitles = [];
      this.playerId = params.get('userId');

      if(this.playerId) {
        this.getPlayerDetails();
        this.authService.getCurrentUserDetail(this.playerId).pipe(takeUntil(this.destroy$)).subscribe(user => {
          this.user = user;
          console.log(this.user)
        })
        this.getParticipatedLeagues()
      }
    })

  }

  getParticipatedLeagues() {
    this.dataService.getParticipatedLeagues(this.playerId).pipe(takeUntil(this.destroy$)).subscribe(leagues => {
      this.participatedLeagues = leagues;
      this.orangecap = this.participatedLeagues.filter(league => league.orangecap?.id === this.playerId);
      this.orangecap = this.orangecap.length ? this.orangecap.map(league => league.name) : [];
      this.purplecap = this.participatedLeagues.filter(league => league.purplecap?.id === this.playerId);
      this.purplecap = this.purplecap.length ? this.purplecap.map(league => league.name) : [];
    })
  }

  getPlayerDetails() {
    this.dataService.getPlayerMatches(this.playerId).then(matches => {
      this.dataService.getPlayerH2HMatches(this.playerId).then(h2hMatches => {
        this.stats = this.getPlayerStats(this.playerId, [...matches, ...h2hMatches]);
        this.isLoading = false;
      })
    })
  }

  getPlayerStats(playerId: string, matches: any[]) {
    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    let recentMatches: any[] = [];
    const headToHead: { [opponentId: string]: any } = {};
    const finalMatches = matches.filter(match => match?.id?.includes('final') && match.status === 'completed');

    const runnerUpTitles = []
    const finalTitles = []
    finalMatches.map(match => {
      const winner = match.team_one.runs > match.team_two.runs ? match.team_one : match.team_two;
      const loser = match.team_one.runs > match.team_two.runs ? match.team_two : match.team_one;
      if(loser.id === playerId) {
        this.runnerUpTitles.push(match?.league_name)
      }

      if(winner.id === playerId) {
        this.finalTitles.push(match?.league_name)
      }
    })

  
    // Batting Stats
    let totalRuns = 0;
    let totalBallsFaced = 0;
  
    // Bowling Stats
    let totalWickets = 0;
    let totalBallsBowled = 0;
    let totalRunsConceded = 0;
    let bestFigures = { wickets: 0, runs: 0 };
  
    matches.forEach(match => {
      if(match.status != 'completed' || match.team_one.balls === 0) {
        return;
      }
      let isPlayerInMatch = false;
      const playerTeam = match.team_one.id === playerId ? match.team_one : (match.team_two.id === playerId ? match.team_two : null);
      const opponentTeam = match.team_one.id === playerId ? match.team_two : (match.team_two.id === playerId ? match.team_one : null);
  
      if (playerTeam) {
        isPlayerInMatch = true;
        if(match.status === 'completed') {
          totalMatches++;
          // Recent Matches
          recentMatches.push(match);

          // Win/Loss count
          if (playerTeam.runs > opponentTeam.runs) {
            wins++;
          } else if (playerTeam.runs < opponentTeam.runs) {
            losses++;
          }

          // Batting stats
          totalRuns += playerTeam.runs;
          totalBallsFaced += playerTeam.balls;
    
          // Bowling stats (if player bowled)
          totalWickets += opponentTeam.wickets;
          totalBallsBowled += opponentTeam.balls;
          totalRunsConceded += opponentTeam.runs;
    
          // Best figures logic
          if (playerTeam.wickets > bestFigures.wickets || 
             (playerTeam.wickets === bestFigures.wickets && opponentTeam.runs < bestFigures.runs)) {
            bestFigures = { wickets: opponentTeam.wickets, runs: opponentTeam.runs };
          }
    
          // Head to Head stats
          if (!headToHead[opponentTeam.id]) {
            headToHead[opponentTeam.id] = {
              id: opponentTeam.id,
              opponent: opponentTeam.name,
              logo: opponentTeam.logo,
              totalRuns: 0,
              ballsFaced: 0,
              totalMatchesPlayed: 0,
              winsAgainst: 0
            };
          }
          headToHead[opponentTeam.id].totalRuns += playerTeam.runs;
          headToHead[opponentTeam.id].ballsFaced += playerTeam.balls;
          headToHead[opponentTeam.id].totalMatchesPlayed++;

        // Count wins against opponent
          if (playerTeam.runs > opponentTeam.runs) {
            headToHead[opponentTeam.id].winsAgainst++;
          }
        }
  
  
  
      }
    });
  
    const battingAvg = totalMatches ? (totalRuns / totalMatches).toFixed(2) : '0.00';
    const strikeRate = totalBallsFaced ? ((totalRuns / totalBallsFaced) * 100).toFixed(2) : '0.00';
    const economy = totalBallsBowled ? ((totalRunsConceded / (totalBallsBowled / 6))).toFixed(2) : '0.00';
  
    let headToHeadArray = Object.values(headToHead).map((team: any) => {
      const teamSR = team.ballsFaced ? ((team.totalRuns / team.ballsFaced) * 100).toFixed(2) : '0.00';
      const avg = team.totalMatchesPlayed ? (team.totalRuns / team.totalMatchesPlayed).toFixed(2) : '0.00';
      const winRate =
      team.totalMatchesPlayed > 0
        ? ((team.winsAgainst / team.totalMatchesPlayed) * 100).toFixed(2) + "%"
        : "0%";
      return {
        id: team.id,
        team: team.opponent,
        logo: team.logo,
        totalRuns: team.totalRuns,
        avg,
        strikeRate: teamSR,
        totalMatchesPlayed: team.totalMatchesPlayed,
        winsAgainst: team.winsAgainst,
        winRate,
      };
    });

    headToHeadArray = headToHeadArray.sort((a, b) => (b.totalRuns || 0) - (a.totalRuns || 0));
    recentMatches = this.sortAndLimitMatches(recentMatches)
    return {
      matchStats: {
        totalMatches,
        wins,
        losses
      },
      battingStats: {
        totalRuns,
        average: battingAvg,
        strikeRate: strikeRate
      },
      bowlingStats: {
        totalWickets,
        economy,
        bestFigures: `${bestFigures.wickets}/${bestFigures.runs}`
      },
      recentMatches,
      headToHead: headToHeadArray
    };
  }

  // Function to sort matches by date and limit to 5 most recent
  sortAndLimitMatches(recentMatches): any[] {
    // Filter matches that have a "date" field
    // const matchesWithDate = recentMatches.filter(match => match.date !== undefined);

    // Sort matches by date in descending order (most recent first)
    recentMatches.sort((a, b) => (b?.date || 0) - (a?.date || 0));

    // Limit to the 5 most recent matches
    return recentMatches.slice(0, 5).map(match => ({
      ...match,
    }));
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getDate(timestamp) {
    const date = new Date(timestamp);
    return date;
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

addNumberSuffix(num) {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return num + "st";
  }
  if (j === 2 && k !== 12) {
    return num + "nd";
  }
  if (j === 3 && k !== 13) {
    return num + "rd";
  }
  return num + "th";
}
  
}
