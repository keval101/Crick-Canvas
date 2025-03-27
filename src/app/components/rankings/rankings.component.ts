import { Component } from '@angular/core';
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

@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.scss']
})
export class RankingsComponent {

  ranking = 'Team';
  mockData: any = {
    teams: [
      { rank: 1, name: "Australia", points: 128, wins: 25, losses: 8 },
      { rank: 2, name: "India", points: 124, wins: 23, losses: 9 },
      { rank: 3, name: "England", points: 118, wins: 22, losses: 10 },
      { rank: 4, name: "New Zealand", points: 112, wins: 20, losses: 12 },
      { rank: 5, name: "South Africa", points: 108, wins: 19, losses: 13 },
    ],
    batsmen: [
      { rank: 1, name: "Steve Smith", country: "AUS", runs: 12456, avg: 61.8, sr: 86.5 },
      { rank: 2, name: "Virat Kohli", country: "IND", runs: 12380, avg: 59.2, sr: 93.2 },
      { rank: 3, name: "Kane Williamson", country: "NZ", runs: 11890, avg: 57.4, sr: 82.1 },
      { rank: 4, name: "Joe Root", country: "ENG", runs: 11234, avg: 56.8, sr: 88.7 },
      { rank: 5, name: "Babar Azam", country: "PAK", runs: 10987, avg: 55.9, sr: 89.3 },
    ],
    bowlers: [
      { rank: 1, name: "Pat Cummins", country: "AUS", wickets: 342, economy: 2.8, avg: 21.5 },
      { rank: 2, name: "Jasprit Bumrah", country: "IND", wickets: 328, economy: 2.9, avg: 22.1 },
      { rank: 3, name: "Kagiso Rabada", country: "SA", wickets: 315, economy: 3.1, avg: 22.8 },
      { rank: 4, name: "James Anderson", country: "ENG", wickets: 298, economy: 2.7, avg: 23.2 },
      { rank: 5, name: "Trent Boult", country: "NZ", wickets: 289, economy: 3.0, avg: 23.5 },
    ],
  };

  constructor(
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.getAllLeagueMatches().subscribe(matches => {
      console.log(matches);
      const teamRankings = this.calculateTeamRankings(matches);
      this.mockData.teams = teamRankings;
      console.log(this.mockData.teams);
    })
  }

  calculateTeamRankings(matches: any[]): TeamRanking[] {
    const rankings: Record<string, TeamRanking> = {};
  
    matches.forEach(match => {
      const { team_one, team_two } = match;
      const teamOneId = team_one.id;
      const teamTwoId = team_two.id;
  
      if(teamOneId === '' || teamTwoId === '') {
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
  
    return Object.values(rankings).sort((a, b) => b.points - a.points);
  }

  // Calculate win rate for teams
  calculateWinRate(wins: number, losses: number): string {
    return ((wins / (wins + losses)) * 100).toFixed(1);
  }
}

