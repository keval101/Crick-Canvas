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
  orangecap: any[] = []
  purplecap: any[] = []
  winners: any[] = []
  runnerUps: any[] = []
  players: any[] = []

  sorting = '-rank';
  allTimeMostRuns: any[] = []
  allTimeMostWickets: any[] = []

  constructor(
    private dataService: DataService,
    private title: Title
  ) { }

  ngOnInit(): void {
    this.title.setTitle('Cricket Rankings | Top Players & Teams')


    this.dataService.getAllPerformances().pipe(
      debounceTime(1000)).subscribe((data) => {
        this.mergePerformanceData(data)
      })
    this.dataService.getLeagues().subscribe((leagues) => {
      this.winners = [];
      this.runnerUps = [];
      this.orangecap = [];
      this.purplecap = [];
      let totalOrangeCaps = []
      let totalPurpleCaps = []
      leagues.map(league => {
        if(league?.winner) {
          delete league.winner.logo
          this.winners.push({...league.winner, league: league.name})
        }
        // if(league?.runnerUp) {
        //   delete league.runnerUp.logo
        //   this.runnerUps.push(league.runnerUp)
        // }

        if(league?.orangecap) {
          delete league.orangecap.logo
          this.orangecap.push({...league.orangecap, league: league.name})
          totalOrangeCaps.push(league.orangecap)
        }

        if(league?.purplecap) {
          delete league.purplecap.logo
          this.purplecap.push({...league.purplecap, league: league.name})
          totalPurpleCaps.push(league.purplecap)
        }
      })
      
      totalOrangeCaps = totalOrangeCaps.sort((a, b) => b.runsFor - a.runsFor)
      totalOrangeCaps = totalOrangeCaps.sort((a, b) => b.wicketsTaken - a.wicketsTaken)
      
      console.log(totalOrangeCaps, totalPurpleCaps)

      this.winners = this.calculateWins(this.winners, 'wonTitle')
      this.orangecap = this.calculateWins(this.orangecap, 'orangecap')
      this.purplecap = this.calculateWins(this.purplecap, 'purplecap')
      this.players = this.mergeAwards(this.winners, this.orangecap, this.purplecap)

    })
    // this.dataService.getAllLeagueMatches().subscribe(matches => {
      
    //   this.updatePlayerRankings(matches);
    //   this.getTeams();

    // })
  }

  getArray(count: number): number[] {
    if(count > 0) {
      return Array(count).fill(0);
    } else {
      return [];
    }
  }

  mergePerformanceData(data: any[]) {
    const mergedMap = new Map();
  
    data.forEach(item => {
      const key = item.id; // or use item.team if you want to group by team name
  
      if (!mergedMap.has(key)) {
        // Clone the object to avoid mutation
        mergedMap.set(key, { ...item, matches: Array.isArray(item.matches) ? [...item.matches] : [] });
      } else {
        const existing = mergedMap.get(key);
  
        // Merge logic
        existing.played += item.played;
        existing.wicketsFallen += item.wicketsFallen;
        existing.wicketsTaken += item.wicketsTaken;
        existing.win += item.win;
        existing.loss += item.loss;
        existing.draw += item.draw;
        existing.runsFor += item.runsFor;
        existing.runsAgainst += item.runsAgainst;
  
        // Merge matches
        existing.matches = [
          ...existing.matches, 
          ...(Array.isArray(item.matches) ? item.matches : [])
        ];

        if(existing.scores && item.scores) {
          // Merge scores
          existing.scores.unshift(item.scores);
        } else if(!existing.scores && item.scores) {
          existing.scores = [item.scores];
        }
  
        // Add overs (custom handling below)
        existing.oversBowled = this.addOvers(existing.oversBowled, item.oversBowled); 
        existing.oversFaced = this.addOvers(existing.oversFaced, item.oversFaced);
      }
    });
  
    const mergedRecords = Array.from(mergedMap.values());
    this.mockData.teams = this.calculateTeamRankingsV2(mergedRecords)
    this.mockData.batsmen = this.calculateBatsmanRankings(mergedRecords)
    this.mockData.bowlers = this.calculateBowlerRankings(mergedRecords)
    this.getTeams();
    return mergedRecords;
  }
  
  mergeAwards(wonTitles, orangeCaps, purpleCaps) {
    const resultMap = new Map();
  
    const mergeArray = (arr, key) => {
      arr.forEach(item => {
        const { id, name } = item;
        if (!resultMap.has(id)) {
          resultMap.set(id, { id, name });
        }
  
        const target = resultMap.get(id);
        target[key] = item[key];
  
        // Handle leagues for each type
        const league = item.leagues;
        if (key === 'wonTitle' && league) {
          if (!Array.isArray(target.leagues)) {
            target.leagues = [];
          }
          target.leagues.push(...(Array.isArray(league) ? league : [league]));
        }
  
        if (key === 'orangecap' && league) {
          if (!Array.isArray(target.orange_leagues)) {
            target.orange_leagues = [];
          }
          target.orange_leagues.push(...(Array.isArray(league) ? league : [league]));
        }
  
        if (key === 'purplecap' && league) {
          if (!Array.isArray(target.purple_leagues)) {
            target.purple_leagues = [];
          }
          target.purple_leagues.push(...(Array.isArray(league) ? league : [league]));
        }
      });
    };
  
    mergeArray(wonTitles, 'wonTitle');
    mergeArray(orangeCaps, 'orangecap');
    mergeArray(purpleCaps, 'purplecap');
  
    let array = Array.from(resultMap.values());
  
    array = array.sort((a, b) => {
      return (b.wonTitle || 0) - (a.wonTitle || 0) ||
             (b.orangecap || 0) - (a.orangecap || 0) ||
             (b.purplecap || 0) - (a.purplecap || 0);
    });
  
    return array;
  }

  getName(item: any) {
    const key = Object.keys(item)[0];
    return key
  }

  getLeagueArray(leagues) {
    return Object.entries(leagues).map(([key, value]) => ({ key, value }));
  }
  
  
  

  calculateWins(winners, type: string) {
    const winMap = new Map();
  
    winners.forEach(winner => {
      const { id, name, team, league } = winner;
      const displayName = name ?? team;
  
      if (!winMap.has(id)) {
        winMap.set(id, {
          id,
          name: displayName,
          [type]: 1,
          leagues: league ? { [league]: 1 } : {} // Initialize league count
        });
      } else {
        const existing = winMap.get(id);
        existing[type] += 1;
  
        if (league) {
          existing.leagues[league] = (existing.leagues[league] || 0) + 1;
        }
      }
    });
  
    return Array.from(winMap.values());
  }
  
  calculateTeamRankingsV2(teams: any[]) {
    teams = teams.filter(x => x?.scores?.length);

    const teamRankings = teams.sort((a, b) => {
      a['points'] = a.win * 2 + a.draw - a.loss;
      b['points'] = b.win * 2 + b.draw - b.loss;
      a['recentForm'] = a.scores[0].map(x => x.result)
      b['recentForm'] = b.scores[0].map(x => x.result)
      a.matches.length = a.matches.length > 5 ? 5 : a.matches.length;
      b.matches.length = b.matches.length > 5 ? 5 : b.matches.length;

      return b.points - a.points;
    })

    teamRankings.map((x, i) => {
      x['rank'] = i + 1;
    })

    return teamRankings;
  }

  addOvers(previousOvers: number, currentOvers: number): string {
    // Helper: convert overs (e.g., 248.1) to total balls
    const oversToBalls = (overs: number): number => {
      const fullOvers = Math.floor(overs);
      const balls = Math.round((overs - fullOvers) * 10); // e.g. 0.4 => 4 balls
      return (fullOvers * 6) + balls;
    };
  
    // Helper: convert total balls back to overs format (e.g., 250.4)
    const ballsToOvers = (balls: number): string => {
      const fullOvers = Math.floor(balls / 6);
      const remainingBalls = balls % 6;
      return `${fullOvers}.${remainingBalls}`;
    };
  
    const totalBalls =
      oversToBalls(previousOvers) + oversToBalls(currentOvers);
  
    return ballsToOvers(totalBalls);
  }

  getStrikeRate(teamData: any): number {
    const runs = teamData.scores[0].reduce((a, b) => a + b.runs, 0);
    const oversFaced = teamData.scores[0].reduce((a, b) => a + b.ballsFaced, 0);
  
    // Convert overs (like 250.1) to balls
    const fullOvers = Math.floor(oversFaced); // 250
    const partialBalls = Math.round((oversFaced - fullOvers) * 10); // 1
    const ballsFaced = (fullOvers * 6) + partialBalls; // 1501
  
    const strikeRate = ballsFaced > 0 ? (runs / ballsFaced) * 100 : 0;
  
    return +strikeRate.toFixed(2); // rounded to 2 decimal places
  }

  formatOvers(overs: any): string {

    if (typeof overs === 'number' && !isNaN(overs)) {
      return overs.toFixed(2);
    }
  
    return overs; // assume string or invalid input
  }

  convertOversToBalls(overs: number | string): number {
    const value = typeof overs === 'string' ? parseFloat(overs) : overs;
  
    const fullOvers = Math.floor(value);
    const balls = Math.round((value - fullOvers) * 10); // e.g., 0.4 => 4 balls
  
    return (fullOvers * 6) + balls;
  }

  calculateBatsmanRankings(teams: any[]) {
    teams = teams.filter(x => x?.scores?.length);
    let batsmanRanking = teams.map((x, i) => {
      if(x.scores?.length) {
        const totalBallsFaced = x.scores[0].reduce((a, b) => a + b.ballsFaced, 0);
        const totalRuns = x.scores[0].reduce((a, b) => a + b.runs, 0);
        x['strikeRate'] = this.getStrikeRate(x);
        x['oversFaced'] = this.formatOvers(x.oversFaced);
        x['matches'] = x.matches.length > 5 ? x.matches.reverse().slice(0, 5) : x.matches;
        x['recentForm'] = x.scores[0].map(y => y.result)
        x['battingAverage'] = totalRuns / (totalBallsFaced / 6);
  
        const average = totalBallsFaced > 0 ? totalRuns / (totalBallsFaced / 6) : 0;
        const strikeRate = totalBallsFaced > 0 ? (totalRuns / totalBallsFaced) * 100 : 0;
        const winning = x.scores[0].map(x => x.result == 'W' ? 1 : -2).reduce((a, b) => a + b, 0);
  
        x['battingPoints'] = (average * 0.30) + (strikeRate * 0.30) + (totalRuns * 0.20) - (x.wicketsFallen * 0.20) + winning; 

        return x;
      } 

    })


    setTimeout(() => {      
      batsmanRanking = batsmanRanking.sort((a, b) => b.battingPoints - a.battingPoints);
  
      batsmanRanking.map((x, i) => {
        x['rank'] = i + 1;
      })
    }, 500);

    return batsmanRanking;
  }

  calculateBowlerRankings(teams: any[]) {
    teams = teams.filter(x => x?.scores?.length);
    let bowlersRanking = teams.map((x, i) => {
      if(x.scores?.length) {
        const totalBallsBowled = x.scores[0].reduce((a, b) => a + b.ballsBowled, 0);
        const totalWickets = x.scores[0].reduce((a, b) => a + b.wicketsTaken, 0);
        const totalRunsConceded = x.scores[0].reduce((a, b) => a + b.runsConceded, 0);
        const balls = this.convertOversToBalls(x.oversBowled);

        const average = totalBallsBowled > 0 ? totalWickets / (totalBallsBowled / 6) : 0;
        const strikeRate = totalBallsBowled > 0 ? (totalWickets / totalBallsBowled) * 100 : 0;
        x['economy'] = this.calculateEconomy(x.runsAgainst, balls);
        const winning = x.scores[0].map(x => x.result == 'W' ? 1 : -2).reduce((a, b) => a + b, 0);

        x['bowlingPoints'] = (average * 0.40) + (strikeRate * 0.40) + (totalWickets * 0.20) + winning; 

        return x;
      } 

    })

    setTimeout(() => {
      bowlersRanking = bowlersRanking.sort((a, b) => b.bowlingPoints - a.bowlingPoints);

      bowlersRanking.map((x, i) => {
        x['rank'] = i + 1;
      })
    }, 500);

    return bowlersRanking;
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
          return match.team_one.runs === match.team_two.runs ? -1 : match.team_one.runs > match.team_two.runs ? 1 : 0
        } else {
          return match.team_two.runs === match.team_one.runs ? -1 : match.team_two.runs > match.team_one.runs ? 1 : 0
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
      this.isLoading = false;

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
            if(isFirstTime || x.rank !== cloneteam.team['teamRank']) {
              await this.updateTeam(team);
            }
          }
        })
      }
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
      } else if (key.includes('played')) {
        return (b.played - a.played) * sortMultiplier;
      } else if (key.includes('won')) {
        return (b.wins - a.wins) * sortMultiplier;
      } else if (key.includes('draw')) {
        return (b.draw - a.draw) * sortMultiplier;
      } else if (key.includes('loss')) {
        return (b.loss - a.loss) * sortMultiplier;
      } else if (key.includes('winp')) {
        return (((b?.win / b?.played) * 100) - ((a?.win / a?.played) * 100)) * sortMultiplier;  
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
      } else if (key.includes('played')) {
        return (b.played - a.played) * sortMultiplier;
      } else if (key.includes('battingAverage')) {
        return (b.battingAverage - a.battingAverage) * sortMultiplier;
      } else if (key.includes('strikeRate')) {
        return (b.strikeRate - a.strikeRate) * sortMultiplier;
      } else if (key.includes('runsFor')) {
        return (b.runsFor - a.runsFor) * sortMultiplier;
      } else if (key.includes('oversFaced')) {
        return (this.oversToBall(b.oversFaced) - this.oversToBall(a.oversFaced)) * sortMultiplier;
      } else if (key.includes('battingPoints')) {
        return (b.battingPoints - a.battingPoints) * sortMultiplier;
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
      } else if (key.includes('wicketsTaken')) {
        return (b.wicketsTaken - a.wicketsTaken) * sortMultiplier;
      } else if (key.includes('economy')) {
        return (b.economy - a.economy) * sortMultiplier;
      } else if (key.includes('played')) {
        return (b.played - a.played) * sortMultiplier;
      } else if (key.includes('points')) {
        return (b.points - a.points) * sortMultiplier;
      } else if (key.includes('oversBowled')) {
        return (this.oversToBall(b.oversBowled) - this.oversToBall(a.oversBowled)) * sortMultiplier;
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

  oversToBall(overs: number | string): number {
      if(overs) {
        const fullOvers = Math.floor(+overs);
        const balls = Math.round((+overs - fullOvers) * 10); // e.g. 0.4 => 4 balls
        return (fullOvers * 6) + balls;
      } else {
        return 0;
      }
  };

  getAbsValue(value) {
    return Math.abs(value);
  }
}

