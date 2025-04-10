import { Component } from '@angular/core';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import * as _ from 'lodash';
import { Title } from '@angular/platform-browser';

interface TeamRanking {
  prev_rank: number;
  curr_rank: number;
  id: string;
  name: string;
  logo: string;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  recentMatches: any
}

interface BatsmanRanking {
  prev_rank: number;
  curr_rank: number;
  name: string;
  teamId: string;
  runs: number;
  recentMatches: any;
  ballsFaced: number;
  average?: number;
  matches?: number;
  strikeRate?: number;
}

interface BowlerRanking {
  prev_rank: number;
  curr_rank: number;
  name: string;
  teamId: string;
  wickets: number;
  recentMatches: any;
  ballsBowled: number;
  economy?: number;
  matches?: number;
  runsConceded?: number;
}

@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.scss']
})
export class RankingsComponent {
  teams: any[] = [];
  ranking = 'Team';
  destroy$ = new Subject();
  isLoading = true;
  mockData: any = {
    teams: [],
    batsmen: [],
    bowlers: [],
  };

  sorting = '-rank';

  constructor(
    private dataService: DataService,
    private title: Title
  ) { }

  ngOnInit(): void {
    this.title.setTitle('Cricket Rankings | Top Players & Teams')
    this.dataService.getAllLeagueMatches().subscribe(matches => {
      
      this.updatePlayerRankings(matches);
      this.getTeams();

    })
  }

  calculateTeamRankings(matches: any[]): TeamRanking[] {
    const rankings: Record<string, TeamRanking> = {};

    matches.forEach(match => {
      const { team_one, team_two } = match;
      const teamOneId = team_one.id;
      const teamTwoId = team_two.id;

      if (teamOneId === '' || teamTwoId === '' || match.status != 'completed' || team_one.balls === 0) {
        return;
      }

      if (!rankings[teamOneId]) {
        rankings[teamOneId] = {
          id: teamOneId,
          curr_rank: 0,
          prev_rank: 0,
          name: team_one.name,
          logo: team_one.logo,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          recentMatches: []
        };
      }

      if (!rankings[teamTwoId]) {
        rankings[teamTwoId] = {
          id: teamTwoId,
          curr_rank: 0,
          prev_rank: 0,
          name: team_two.name,
          logo: team_one.logo,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          recentMatches: []
        };
      }

      rankings[teamOneId].matches++;
      rankings[teamTwoId].matches++;

      rankings[teamOneId].recentMatches.push(match);
      rankings[teamTwoId].recentMatches.push(match);

      if (team_one.runs > team_two.runs) {
        rankings[teamOneId].wins++;
        rankings[teamOneId].points += 2;
        rankings[teamTwoId].losses++;
        rankings[teamTwoId].points -= 1;
      } else if (team_one.runs < team_two.runs) {
        rankings[teamTwoId].wins++;
        rankings[teamTwoId].points += 2;
        rankings[teamOneId].losses++;
        rankings[teamOneId].points -= 1;
      } else {
        rankings[teamOneId].draws++;
        rankings[teamTwoId].draws++;
        rankings[teamOneId].points += 1;
        rankings[teamTwoId].points += 1;
      }
    });

    const data = Object.values(rankings).sort((a, b) => {
      const recentMatchesB = this.sortAndLimitMatches(b.recentMatches)
      const recentMatchesA = this.sortAndLimitMatches(a.recentMatches)
      const recentFormB = recentMatchesB.map(match => {
        if(match.team_one.id === b.id) {
          return match.team_one.runs > match.team_two.runs ? 1 : 0
        } else {
          return match.team_two.runs > match.team_one.runs ? 1 : 0
        }
      })
      const recentFormA = recentMatchesA.map(match => {
        if(match.team_one.id === a.id) {
          return match.team_one.runs > match.team_two.runs ? 1 : 0
        } else {
          return match.team_two.runs > match.team_one.runs ? 1 : 0
        }
      })
      a['recentForm'] = recentFormA;
      b['recentForm'] = recentFormB;

      return b.points - a.points
    });
    return data.map((x, i) => ({ ...x, rank: i + 1 }));
  }

  // New method to update player rankings (placeholder for individual player data)
  updatePlayerRankings(matches: any[]): void {
    const batsmen: Record<string, BatsmanRanking> = {};
    const bowlers: Record<string, BowlerRanking> = {};

    matches.forEach(match => {
      const { team_one, team_two } = match;

      if (team_one?.id === '' || team_two?.id === '' || match.status != 'completed' || team_one.balls === 0) {
        return;
      }

      const teamOneBatsman = `${team_one.name}`;
      const teamTwoBatsman = `${team_two.name}`;
      const teamOneBowler = `${team_one.name}`;
      const teamTwoBowler = `${team_two.name}`;

      if (!batsmen[teamOneBatsman]) {
        batsmen[teamOneBatsman] = { name: teamOneBatsman, teamId: team_one.id, runs: 0, ballsFaced: 0, matches: 0, recentMatches: [], curr_rank: 0, prev_rank: 0 };
      }
      if (!batsmen[teamTwoBatsman]) {
        batsmen[teamTwoBatsman] = { name: teamTwoBatsman, teamId: team_two.id, runs: 0, ballsFaced: 0, matches: 0, recentMatches: [], curr_rank: 0, prev_rank: 0 };
      }
      if (!bowlers[teamOneBowler]) {
        bowlers[teamOneBowler] = { name: teamOneBowler, teamId: team_one.id, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0, recentMatches: [], curr_rank: 0, prev_rank: 0 };
      }
      if (!bowlers[teamTwoBowler]) {
        bowlers[teamTwoBowler] = { name: teamTwoBowler, teamId: team_two.id, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0, recentMatches: [], curr_rank: 0, prev_rank: 0 };
      }

      batsmen[teamOneBatsman].runs += team_one.runs;
      batsmen[teamOneBatsman].ballsFaced += team_one.balls;
      batsmen[teamTwoBatsman].runs += team_two.runs;
      batsmen[teamTwoBatsman].ballsFaced += team_two.balls;

      batsmen[teamOneBatsman].recentMatches.push(match)
      batsmen[teamTwoBatsman].recentMatches.push(match)

      batsmen[teamOneBatsman].matches++;
      batsmen[teamTwoBatsman].matches++;

      bowlers[teamOneBowler].matches++;
      bowlers[teamTwoBowler].matches++;

      bowlers[teamOneBowler].recentMatches.push(match)
      bowlers[teamTwoBowler].recentMatches.push(match)

      bowlers[teamOneBowler].wickets += team_two.wickets;
      bowlers[teamOneBowler].ballsBowled += team_two.balls;
      bowlers[teamOneBowler].runsConceded += team_two.runs;

      bowlers[teamTwoBowler].wickets += team_one.wickets;
      bowlers[teamTwoBowler].ballsBowled += team_one.balls;
      bowlers[teamTwoBowler].runsConceded += team_one.runs;
    });

    // this.mockData.batsmen = this.sortAndLimitMatches(this.mockData.batsmen)
    // this.mockData.bowlers = this.sortAndLimitMatches(this.mockData.bowlers)

    // Calculate averages and strike rates/economy
    this.mockData.batsmen = Object.values(batsmen).map((b, i) => {
      b.recentMatches = this.sortAndLimitMatches(b.recentMatches)
      const runs = b.recentMatches.map(match => {
        if(match.team_one.id === b.teamId) {
          return match.team_one.runs
        } else {
          return match.team_two.runs
        }
      }).reduce((a, b) => a + b, 0);
      
      const recentForm = b.recentMatches.map(match => {
        if(match.team_one.id === b.teamId) {
          return match.team_one.runs > match.team_two.runs ? 1 : 0
        } else {
          return match.team_two.runs > match.team_one.runs ? 1 : 0
        }
      })


      const ballsFaced = b.recentMatches.map(match => {
        if(match.team_one.id === b.teamId) {
          return match.team_one.balls
        } else {
          return match.team_two.balls
        }
      }).reduce((a, b) => a + b, 0);

      const wickets = b.recentMatches.map(match => {
        if(match.team_one.id === b.teamId) {
          return match.team_one.wickets
        } else {
          return match.team_two.wickets
        }
      }).reduce((a, b) => a + b, 0);

      const average = ballsFaced > 0 ? runs / (ballsFaced / 6) : 0;
      const strikeRate = ballsFaced > 0 ? (runs / ballsFaced) * 100 : 0;
      const winning = recentForm.map(x => x == 1 ? 1 : -2).reduce((a, b) => a + b, 0);

      const points = (average * 0.30) + (strikeRate * 0.30) + (runs * 0.20) - (wickets * 0.20) + winning;  

      return {
        ...b,
        recentForm,
        average: b.ballsFaced > 0 ? b.runs / (b.ballsFaced / 6) : 0, // Simplified average
        strikeRate: b.ballsFaced > 0 ? (b.runs / b.ballsFaced) * 100 : 0,
        points: Math.round(points)
      }
    }).sort((a, b) => {
      if(a.points === b.points) {
        return b.runs - a.runs
      } else {
        return b.points - a.points
      }
    });

    this.mockData.bowlers = Object.values(bowlers).map((b, i) => {
      b.recentMatches = this.sortAndLimitMatches(b.recentMatches)

      const wickets = b.recentMatches.map(match => {
        if(match.team_one.id != b.teamId) {
          return match.team_one.wickets
        } else {
          return match.team_two.wickets
        }
      }).reduce((a, b) => a + b, 0);

      const ballsBowled = b.recentMatches.map(match => {
        if(match.team_one.id != b.teamId) {
          return match.team_one.balls
        } else {
          return match.team_two.balls
        }
      }).reduce((a, b) => a + b, 0);

      const runsConceded = b.recentMatches.map(match => {
        if(match.team_one.id != b.teamId) {
          return match.team_one.runs
        } else {
          return match.team_two.runs
        }
      }).reduce((a, b) => a + b, 0);

      const recentForm = b.recentMatches.map(match => {
        if(match.team_one.id === b.teamId) {
          return match.team_one.runs > match.team_two.runs ? 1 : 0
        } else {
          return match.team_two.runs > match.team_one.runs ? 1 : 0
        }
      })

      const average = ballsBowled > 0 ? wickets / (ballsBowled / 6) : 0;
      const strikeRate = ballsBowled > 0 ? (wickets / ballsBowled) * 100 : 0;
      const economy = this.calculateEconomy(runsConceded, ballsBowled);
      const winning = recentForm.map(x => x == 1 ? 1 : -2).reduce((a, b) => a + b, 0);
      
      
      // const points = (average * 0.10) + (strikeRate * 0.35) + (wickets * 0.45) - ((runsConceded / 50) * 0.05);
      const points = (average * 0.40) + (strikeRate * 0.40) + (wickets * 0.20) + winning; 

      return {
        ...b,
        recentForm,
        // economy: b.ballsBowled > 0 ? (b.wickets * 6 / b.ballsBowled) : 0, // Simplified economy
        economy: this.calculateEconomy(b.runsConceded, b.ballsBowled),
        points: Math.round(points)
      }
    }).sort((a, b) => {
      if(a.points === b.points) {
        return b.wickets - a.wickets
      } else {
        return b.points - a.points
      }
    });

    this.mockData.batsmen.map((x, i) => {
      x['rank'] = i + 1;
    })

    this.mockData.bowlers.map((x, i) => {
      x['rank'] = i + 1;
    })

    const teamRankings = this.calculateTeamRankings(matches);
    this.mockData.teams = teamRankings;
  }

  calculateEconomy(runsConceded: number, ballsBowled: number): number {
    if (ballsBowled === 0) {
      return 0; // Avoid division by zero
    }
    const oversBowled = ballsBowled / 6; // Convert balls to overs
    return (runsConceded / oversBowled); // Round to 2 decimal places
  }

  async getTeams() {
    this.dataService.getAllUsers().then((teams) => {
      this.teams = teams;

      if(this.mockData.batsmen.length) {
        this.mockData.batsmen.map(async (x, i) => {
          const team = this.teams.find((y) => y.uid === x.teamId);
          let isFirstTime = false;
          if(team?.team) {
            const cloneteam = _.cloneDeep(team)
            if(!cloneteam.team['battingRank']) {
              cloneteam.team['battingRank'] = x.rank;
              cloneteam.team['prev_battingRank'] = x.rank;
              x['curr_rank'] = x.rank;
              x['prev_rank'] = x.rank;
              isFirstTime = true;
            } else {
              if(x.rank !== cloneteam.team['battingRank']) {            
                cloneteam.team['prev_battingRank'] = _.cloneDeep(cloneteam.team['battingRank']);
                cloneteam.team['battingRank'] = x.rank;
                x['curr_rank'] = cloneteam.team['battingRank'];
                x['prev_rank'] = cloneteam.team['prev_battingRank'];
              }
            }

            console.log(x.rank, cloneteam.team['battingRank'], cloneteam.name)
            if(isFirstTime || x.rank !== cloneteam.team['battingRank']) {
              await this.updateTeam(team);
            }
          }
        })
      }

      if(this.mockData.bowlers.length) {
        this.mockData.bowlers.map(async (x, i) => {
          const team = this.teams.find((y) => y.uid === x.teamId);
          let isFirstTime = false;
          if(team?.team) {
            const cloneteam = _.cloneDeep(team)
            if(!cloneteam.team['bowlingRank']) {
              cloneteam.team['bowlingRank'] = x.rank;
              cloneteam.team['prev_bowlingRank'] = x.rank;
              isFirstTime = true;
              x['curr_rank'] = x.rank;
              x['prev_rank'] = x.rank;
            } else {
              if(x.rank !== cloneteam.team['bowlingRank']) {                          
                cloneteam.team['prev_bowlingRank'] = JSON.parse(JSON.stringify(cloneteam.team['bowlingRank']));
                cloneteam.team['bowlingRank'] = x.rank;
                x['curr_rank'] = cloneteam.team['bowlingRank'];
                x['prev_rank'] = cloneteam.team['prev_bowlingRank'];
              }
            }
            console.log(x.rank, cloneteam.team['bowlingRank'], cloneteam.name)
            if(isFirstTime || x.rank !== cloneteam.team['bowlingRank']) {
              await this.updateTeam(team);
            }
          }
        })
      }

      if(this.mockData.teams.length) {
        this.mockData.teams.map(async (x, i) => {
          const team = this.teams.find((y) => y.uid === x.id);
          let isFirstTime = false;
          if(team?.team) {
            const cloneteam = _.cloneDeep(team)
            if(!cloneteam.team['teamRank']) {
              cloneteam.team['teamRank'] = x.rank;
              cloneteam.team['prev_teamRank'] = x.rank;
              x['curr_rank'] = x.rank;
              x['prev_rank'] = x.rank;
              isFirstTime = true;
            } else {
              if(x.rank !== cloneteam.team['teamRank']) {                                        
                cloneteam.team['prev_teamRank'] = JSON.parse(JSON.stringify(cloneteam.team['teamRank']));
                cloneteam.team['teamRank'] = x.rank;
                x['curr_rank'] = cloneteam.team['teamRank'];
                x['prev_rank'] = cloneteam.team['prev_teamRank'];
              }
            }
            console.log(x.rank, cloneteam.team['teamRank'], cloneteam.name)
            if(isFirstTime || x.rank !== cloneteam.team['teamRank']) {
              await this.updateTeam(team);
            }
          }
        })
      }

      console.log(this.teams)
      this.isLoading = false;

    });
  }

  async updateTeam(team: any) {
    await this.dataService.updateUserDetail(team, team.uid);
  }

  getTeamDetails(team: any) {
    const teamData = this.teams.find((x) => x.uid === (team?.id ?? team));
    return teamData;
  }


  // Calculate win rate for teams
  calculateWinRate(wins: number, losses: number): string {
    return ((wins / (wins + losses)) * 100).toFixed(1);
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

  sortByTeams(key: string, direction: 'asc' | 'desc' = 'desc') {
    if (direction === 'desc') {
      this.sorting = '-' + key;
    } else {
      this.sorting = key;
    }
    this.mockData.teams = this.mockData.teams.sort((a, b) => {
      // Determine the multiplier based on sort direction
      const sortMultiplier = direction === 'asc' ? 1 : -1;
      if (key.includes('rank')) {
        return (b.rank - a.rank) * sortMultiplier;
      } else if (key.includes('points')) {
        return (b.points - a.points) * sortMultiplier;
      } else if (key.includes('matches')) {
        return (b.matches - a.matches) * sortMultiplier;
      } else if (key.includes('won')) {
        return (b.wins - a.wins) * sortMultiplier;
      } else if (key.includes('draw')) {
        return (b.draws - a.draws) * sortMultiplier;
      } else if (key.includes('lose')) {
        return (b.losses - a.losses) * sortMultiplier;
      } else if (key.includes('winp')) {
        return (((b?.wins / b?.matches) * 100) - ((a?.wins / a?.matches) * 100)) * sortMultiplier;
      } else {
        // Default sorting by rank
        return (b.rank - a.rank) * sortMultiplier;
      }
    });
  }

  sortByBatsman(key: string, direction: 'asc' | 'desc' = 'desc') {
    if (direction === 'desc') {
      this.sorting = '-' + key;
    } else {
      this.sorting = key;
    }

    this.mockData.batsmen = this.mockData.batsmen.sort((a, b) => {
      // Determine the multiplier based on sort direction
      const sortMultiplier = direction === 'asc' ? 1 : -1;

      if (key.includes('rank')) {
        return (b.rank - a.rank) * sortMultiplier;
      } else if (key.includes('matches')) {
        return (b.matches - a.matches) * sortMultiplier;
      } else if (key.includes('average')) {
        return (b.average - a.average) * sortMultiplier;
      } else if (key.includes('strikeRate')) {
        return (b.strikeRate - a.strikeRate) * sortMultiplier;
      } else if (key.includes('runs')) {
        return (b.runs - a.runs) * sortMultiplier;
      } else if (key.includes('ballsFaced')) {
        return (b.ballsFaced - a.ballsFaced) * sortMultiplier;
      } else if (key.includes('points')) {
        return (b.points - a.points) * sortMultiplier;
      } else {
        // Default sorting by rank
        return (b.rank - a.rank) * sortMultiplier; 
      }
    });
  }

  sortByBowler(key: string, direction: 'asc' | 'desc' = 'desc') {
    if (direction === 'desc') {
      this.sorting = '-' + key;
    } else {
      this.sorting = key;
    }

    this.mockData.bowlers = this.mockData.bowlers.sort((a, b) => {
      // Determine the multiplier based on sort direction
      const sortMultiplier = direction === 'asc' ? 1 : -1;

      if (key.includes('rank')) {
        return (b.rank - a.rank) * sortMultiplier;
      } else if (key.includes('wickets')) {
        return (b.wickets - a.wickets) * sortMultiplier;
      } else if (key.includes('economy')) {
        return (b.economy - a.economy) * sortMultiplier;
      } else if (key.includes('matches')) {
        return (b.matches - a.matches) * sortMultiplier;
      } else if (key.includes('points')) {
        return (b.points - a.points) * sortMultiplier;
      } else if (key.includes('ballsBowled')) {
        return (b.ballsBowled - a.ballsBowled) * sortMultiplier;
      } else {
        // Default sorting by rank
        return (b.rank - a.rank) * sortMultiplier;
      }
    });
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

  getAbsValue(value) {
    return Math.abs(value);
  }
}

