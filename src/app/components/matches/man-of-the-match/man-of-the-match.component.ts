import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-man-of-the-match',
  templateUrl: './man-of-the-match.component.html',
  styleUrls: ['./man-of-the-match.component.scss']
})
export class ManOfTheMatchComponent {
  @Input() player;

  
  calculateStrikeRate(totalRuns, totalBallsFaced) {
    if (totalBallsFaced === 0) {
      return 0;
    }
    return !isNaN((totalRuns / totalBallsFaced) * 100)
      ? ((totalRuns / totalBallsFaced) * 100).toFixed(2)
      : 0;
  }

  calculateEconomy(overs, runs) {
    const oversFloat = parseFloat(overs);
    const economy = runs / oversFloat;
    const economyRounded = economy.toFixed(2);
    return !isNaN(economy) ? economyRounded : 0;
  }


}
