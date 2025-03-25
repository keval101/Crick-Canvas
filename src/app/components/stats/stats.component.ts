import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private dataService: DataService
  ) { }

  ngOnInit(): void {

    this.playerId = this.route.snapshot.paramMap.get('userId');

    if(this.playerId) {
      this.getPlayerDetails();
      this.authService.getCurrentUserDetail(this.playerId).subscribe(user => {
        this.user = user;
      })
    }
  }

  getPlayerDetails() {
    console.log(this.playerId)
    this.dataService.getPlayerMatches(this.playerId).then(matches => {
      this.stats = this.getPlayerStats(this.playerId, matches);
      console.log(this.stats)
      this.isLoading = false;
    })
  }

  getPlayerStats(playerId: string, matches: any[]) {
    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    const recentMatches: any[] = [];
    const headToHead: { [opponentId: string]: any } = {};
  
    // Batting Stats
    let totalRuns = 0;
    let totalBallsFaced = 0;
  
    // Bowling Stats
    let totalWickets = 0;
    let totalBallsBowled = 0;
    let totalRunsConceded = 0;
    let bestFigures = { wickets: 0, runs: 0 };
  
    matches.forEach(match => {
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
              opponent: opponentTeam.name,
              logo: opponentTeam.logo,
              totalRuns: 0,
              ballsFaced: 0,
              matches: 0,
            };
          }
          headToHead[opponentTeam.id].totalRuns += playerTeam.runs;
          headToHead[opponentTeam.id].ballsFaced += playerTeam.balls;
          headToHead[opponentTeam.id].matches++;
        }
  
  
  
      }
    });
  
    const battingAvg = totalMatches ? (totalRuns / totalMatches).toFixed(2) : '0.00';
    const strikeRate = totalBallsFaced ? ((totalRuns / totalBallsFaced) * 100).toFixed(2) : '0.00';
    const economy = totalBallsBowled ? ((totalRunsConceded / (totalBallsBowled / 6))).toFixed(2) : '0.00';
  
    const headToHeadArray = Object.values(headToHead).map((team: any) => {
      const teamSR = team.ballsFaced ? ((team.totalRuns / team.ballsFaced) * 100).toFixed(2) : '0.00';
      const avg = team.matches ? (team.totalRuns / team.matches).toFixed(2) : '0.00';
      return {
        team: team.opponent,
        logo: team.logo,
        totalRuns: team.totalRuns,
        avg,
        strikeRate: teamSR,
      };
    });
  
    // display only last 5 matches
    recentMatches.length = recentMatches.length > 5 ? 5 : recentMatches.length;
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
  
}
