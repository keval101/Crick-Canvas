import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.component.html',
  styleUrls: ['./player-detail.component.scss']
})
export class PlayerDetailComponent {

  playerId: string;
  player$ = new BehaviorSubject<any>({});
  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ){}

  ngOnInit() {
    this.playerId = this.route.snapshot.params['playerId'];
    this.getPlayerDetail();
  }

   getPlayerDetail() {
    this.dataService.getPlayer(this.playerId).subscribe(player => {
      console.log(player)
      const stats = {
        balls: player.matches.reduce((acc, curr) => typeof curr.balls === 'number' ? curr.balls + acc : acc, 0),
        runs: player.matches.reduce((acc, curr) => typeof curr.runs === 'number' ? curr.runs + acc : acc, 0),
        sixes: player.matches.reduce((acc, curr) => typeof curr.sixes === 'number' ? curr.sixes + acc : acc, 0),
        fours: player.matches.reduce((acc, curr) => typeof curr.fours === 'number' ? curr.fours + acc : acc, 0),
        catches: player.matches.reduce((acc, curr) => typeof curr.catches === 'number' ? curr.catches + acc : acc, 0),
        bowled: player.matches.reduce((acc, curr) => typeof curr.bowled === 'number' ? curr.bowled + acc : acc, 0),
        wickets: player.matches.reduce((acc, curr) => typeof curr.wickets === 'number' ? curr.wickets + acc : acc, 0),
        overs: player.matches.reduce((acc, curr) => typeof curr.overs === 'number' ? curr.overs + acc : acc, 0),
        highScore: player.matches.reduce((max, curr) => (curr.runs > max) ? curr.runs : max, player.matches[0].runs),
        innigs: player.matches.length ?? 0,
      }
      console.log(stats)
      player = {...player, stats}

      this.player$.next(player)
    })
  }

  calculateStrikeRate(totalRuns, totalBallsFaced) {
    if (totalBallsFaced === 0) { return 0;}
    return !isNaN((totalRuns / totalBallsFaced) * 100) ? ((totalRuns / totalBallsFaced) * 100).toFixed(2) : 0;
  }

  calculateBattingAverage(totalRuns, totalIng) {
    if (totalIng === 0) { return 0;}
    return !isNaN((totalRuns / totalIng) * 100) ? ((totalRuns / totalIng) * 100).toFixed(2) : 0;
  }

  calculateEconomy(overs, runs) {
    const oversFloat = parseFloat(overs);
    const economy = (runs / oversFloat) * 6;
    const economyRounded = economy.toFixed(2);
    return !isNaN(economy) ? economyRounded : 0;
  }
}
