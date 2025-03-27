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
  finalTitles: any[] = [];
  runnerUpTitles: any[] = [];
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private dataService: DataService
  ) { }

  ngOnInit(): void {

    this.playerId = this.route.snapshot.paramMap.get('userId');
    this.route.paramMap.subscribe(params => {
      this.isLoading = true;
      this.finalTitles = [];
      this.runnerUpTitles = [];
      this.playerId = params.get('userId');
      console.log(this.playerId)

      if(this.playerId) {
        this.getPlayerDetails();
        this.authService.getCurrentUserDetail(this.playerId).subscribe(user => {
          this.user = user;
        })
      }
    })

  }

  getPlayerDetails() {
    console.log(this.playerId)
    this.dataService.getPlayerMatches(this.playerId).then(matches => {
      this.stats = this.getPlayerStats(this.playerId, matches);
      console.log(this.stats, matches)
      this.isLoading = false;
    })
  }

  getPlayerStats(playerId: string, matches: any[]) {
    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    let recentMatches: any[] = [];
    const headToHead: { [opponentId: string]: any } = {};
    const finalMatches = matches.filter(match => match?.id?.includes('final') && match.status === 'completed');
    console.log(finalMatches)

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
  
    console.log('headToHeadArray', headToHead);
    const headToHeadArray = Object.values(headToHead).map((team: any) => {
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
  
    // display only last 5 matches
    // recentMatches = recentMatches.reverse();
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
