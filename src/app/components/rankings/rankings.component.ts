import { Component } from '@angular/core';

@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.scss']
})
export class RankingsComponent {

  mockData = {
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

  constructor() { }

  ngOnInit(): void {
  }

  // Calculate win rate for teams
  calculateWinRate(wins: number, losses: number): string {
    return ((wins / (wins + losses)) * 100).toFixed(1);
  }
}

