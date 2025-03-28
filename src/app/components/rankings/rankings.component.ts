import { Component } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

interface TeamRanking {
  id: string;
  name: string;
  logo: string;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
}

interface BatsmanRanking {
  name: string;
  teamId: string;
  runs: number;
  ballsFaced: number;
  average?: number;
  matches?: number;
  strikeRate?: number;
}

interface BowlerRanking {
  name: string;
  teamId: string;
  wickets: number;
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
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.getAllLeagueMatches().subscribe(matches => {
      console.log(matches);
      this.getTeams();
      const teamRankings = this.calculateTeamRankings(matches);
      this.mockData.teams = teamRankings;
      this.updatePlayerRankings(matches);

      console.log(this.mockData.teams);
    })
  }

  calculateTeamRankings(matches: any[]): TeamRanking[] {
    const rankings: Record<string, TeamRanking> = {};
  
    matches.forEach(match => {
      const { team_one, team_two } = match;
      const teamOneId = team_one.id;
      const teamTwoId = team_two.id;
  
      if(teamOneId === '' || teamTwoId === '' || match.status != 'completed' || team_one.balls === 0) {  
        return;
      }

      if (!rankings[teamOneId]) {
        rankings[teamOneId] = {
          id: teamOneId,
          name: team_one.name,
          logo: team_one.logo,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0
        };
      }
  
      if (!rankings[teamTwoId]) {
        rankings[teamTwoId] = {
          id: teamTwoId,
          name: team_two.name,
          logo: team_one.logo,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0
        };
      }
  
      rankings[teamOneId].matches++;
      rankings[teamTwoId].matches++;
  
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
    console.log(rankings)
  
    this.isLoading = false;
    const data = Object.values(rankings).sort((a, b) => b.points - a.points);
    return data.map((x, i) => ({ ...x, rank: i++ }));
  }

  // New method to update player rankings (placeholder for individual player data)
  updatePlayerRankings(matches: any[]): void {
    const batsmen: Record<string, BatsmanRanking> = {};
    const bowlers: Record<string, BowlerRanking> = {};

    matches.forEach(match => {
      const { team_one, team_two } = match;

      if(team_one?.id === '' || team_two?.id === '' || match.status != 'completed' || team_one.balls === 0) {  
        return;
      }

      // Placeholder: Assuming player data will come later
      // For now, we'll aggregate team-level batting/bowling stats
      // Replace this with actual player data when available
      const teamOneBatsman = `${team_one.name}`; // Dummy key
      const teamTwoBatsman = `${team_two.name}`; // Dummy key
      const teamOneBowler = `${team_one.name}`; // Dummy key
      const teamTwoBowler = `${team_two.name}`; // Dummy key

      if (!batsmen[teamOneBatsman]) {
        batsmen[teamOneBatsman] = { name: teamOneBatsman, teamId: team_one.id, runs: 0, ballsFaced: 0, matches: 0 };
      }
      if (!batsmen[teamTwoBatsman]) {
        batsmen[teamTwoBatsman] = { name: teamTwoBatsman, teamId: team_two.id, runs: 0, ballsFaced: 0, matches: 0 };
      }
      if (!bowlers[teamOneBowler]) {
        bowlers[teamOneBowler] = { name: teamOneBowler, teamId: team_one.id, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0 };
      }
      if (!bowlers[teamTwoBowler]) {
        bowlers[teamTwoBowler] = { name: teamTwoBowler, teamId: team_two.id, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0 };
      }

      batsmen[teamOneBatsman].runs += team_one.runs;
      batsmen[teamOneBatsman].ballsFaced += team_one.balls;
      batsmen[teamTwoBatsman].runs += team_two.runs;
      batsmen[teamTwoBatsman].ballsFaced += team_two.balls;

      batsmen[teamOneBatsman].matches++;
      batsmen[teamTwoBatsman].matches++;

      bowlers[teamOneBowler].matches++;
      bowlers[teamTwoBowler].matches++;

      bowlers[teamOneBowler].wickets += team_two.wickets;
      bowlers[teamOneBowler].ballsBowled += team_two.balls;
      bowlers[teamOneBowler].runsConceded += team_two.runs;

      bowlers[teamTwoBowler].wickets += team_one.wickets;
      bowlers[teamTwoBowler].ballsBowled += team_one.balls;
      bowlers[teamTwoBowler].runsConceded += team_one.runs;
    });

    // Calculate averages and strike rates/economy
    this.mockData.batsmen = Object.values(batsmen).map((b, i) => ({
      ...b,
      average: b.ballsFaced > 0 ? b.runs / (b.ballsFaced / 6) : 0, // Simplified average
      strikeRate: b.ballsFaced > 0 ? (b.runs / b.ballsFaced) * 100 : 0,
    })).sort((a, b) => b.runs - a.runs);

    this.mockData.bowlers = Object.values(bowlers).map((b, i) => ({
      ...b,
      // economy: b.ballsBowled > 0 ? (b.wickets * 6 / b.ballsBowled) : 0, // Simplified economy
      economy: this.calculateEconomy(b.runsConceded, b.ballsBowled),
    })).sort((a, b) => b.wickets - a.wickets);

    this.mockData.batsmen.map((x, i) => {
      x['rank'] = i;
    })

    this.mockData.bowlers.map((x, i) => {
      x['rank'] = i;
    })

    console.log('Batsmen Rankings:', this.mockData.batsmen);
    console.log('Bowlers Rankings:', this.mockData.bowlers);
  }

  calculateEconomy(runsConceded: number, ballsBowled: number): number {
    if (ballsBowled === 0) {
      return 0; // Avoid division by zero
    }
    const oversBowled = ballsBowled / 6; // Convert balls to overs
    return (runsConceded / oversBowled); // Round to 2 decimal places
  }
  
  getTeams() {
    this.dataService.getAllusers().pipe(takeUntil(this.destroy$)).subscribe((teams) => {
      this.teams = teams;
    });
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
  if(direction === 'desc') {
    this.sorting = '-' + key;
  } else {
    this.sorting = key;
  }
  console.log(this.sorting)
  this.mockData.teams = this.mockData.teams.sort((a, b) => {
    // Determine the multiplier based on sort direction
    const sortMultiplier = direction === 'asc' ? 1 : -1;
    console.log(sortMultiplier, this.sorting)
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
    } else {
      // Default sorting by rank
      return (b.rank - a.rank) * sortMultiplier;
    }
  });
}
}

