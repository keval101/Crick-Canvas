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

  async ngOnInit() {
    this.playerId = this.route.snapshot.params['playerId'];
    await this.getPlayerDetail();
  }

   async getPlayerDetail() {
    const playerDetail = await this.dataService.getPlayer(this.playerId);
    let player;
      const stats = {
        balls: playerDetail?.matches.reduce((acc, curr) => typeof curr?.balls === 'number' ? curr?.balls + acc : acc, 0),
        runs: playerDetail?.matches.reduce((acc, curr) => typeof curr?.runs === 'number' ? curr?.runs + acc : acc, 0),
        sixes: playerDetail?.matches.reduce((acc, curr) => typeof curr?.sixes === 'number' ? curr?.sixes + acc : acc, 0),
        fours: playerDetail?.matches.reduce((acc, curr) => typeof curr?.fours === 'number' ? curr?.fours + acc : acc, 0),
        catches: playerDetail?.matches.reduce((acc, curr) => typeof curr?.catches === 'number' ? curr?.catches + acc : acc, 0),
        bowled: playerDetail?.matches.reduce((acc, curr) => typeof curr?.bowled === 'number' ? curr?.bowled + acc : acc, 0),
        concededRuns: playerDetail?.matches.reduce((acc, curr) => typeof curr?.concededRuns === 'number' ? curr?.concededRuns + acc : acc, 0),
        wickets: playerDetail?.matches.reduce((acc, curr) => typeof curr?.wickets === 'number' ? curr?.wickets + acc : acc, 0),
        maidens: playerDetail?.matches.reduce((acc, curr) => typeof curr?.maidens === 'number' ? curr?.maidens + acc : acc, 0),
        overs: playerDetail?.matches.reduce((acc, curr) => typeof curr?.overs === 'number' ? curr?.overs + acc : acc, 0),
        outs: playerDetail?.matches.reduce((acc, curr) => {
          if (curr.out) {
            return acc + 1;
        } else {
            return acc;
        }
        }, 0),
        highScore: playerDetail?.matches.reduce((max, curr) => (curr?.runs > max) ? curr?.runs : max, playerDetail?.matches[0]?.runs),
        innigs: playerDetail?.matches.length ?? 0,
      }
      player = {...player, stats}

      this.player$.next(player)
  }

  calculateStrikeRate(totalRuns, totalBallsFaced) {
    if (totalBallsFaced === 0) { return 0;}
    return !isNaN((totalRuns / totalBallsFaced) * 100) ? ((totalRuns / totalBallsFaced) * 100).toFixed(2) : 0;
  }

  calculateBattingAverage(totalRuns, timesOut) {
    if (timesOut === 0) { return 0;}
    return !isNaN((totalRuns / timesOut)) ? ((totalRuns / timesOut)).toFixed(2) : 0;
  }

  calculateBowlingAverage(runsConceded, wicketsTaken) {
    if (wicketsTaken === 0) {
        return '0'; // Handling division by zero scenario
    }
    return (runsConceded / wicketsTaken).toFixed(2);
}

  calculateEconomy(overs, runs) {
    const oversFloat = parseFloat(overs);
    const economy = (runs / oversFloat) * 6;
    const economyRounded = economy.toFixed(2);
    return !isNaN(economy) ? economyRounded : 0;
  }
}
