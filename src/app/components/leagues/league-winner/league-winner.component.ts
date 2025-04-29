import { Component, Input, Renderer2 } from '@angular/core';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-league-winner',
  templateUrl: './league-winner.component.html',
  styleUrls: ['./league-winner.component.scss']
})
export class LeagueWinnerComponent {
  @Input() match: any;
  @Input() league: any;
  winningTeam: any;
  loserTeam: any;
  // winningTeam: string = 'Mumbai Titans';
  finalScore = '';
  backgroundImage: string = 'https://public.readdy.ai/ai/img_res/121aa8f4f0f09a7ad5a607e3647115a7.jpg';
  trophyImage: string = 'https://public.readdy.ai/ai/img_res/0a7f7a534d10bf91b04e8e76ed3a2d4a.jpg';

  constructor(private renderer: Renderer2, private dataService: DataService) {}

  ngOnInit(): void {
    const winner = this.match.team_one.runs > this.match.team_two.runs ? this.match.team_one : this.match.team_two;
    const loser = this.match.team_one.runs > this.match.team_two.runs ? this.match.team_two : this.match.team_one;
    this.winningTeam = winner;
    this.finalScore = `Final Score: ${winner.name} ${winner.runs}/${winner.wickets} vs ${loser.name} ${loser.runs}/${loser.wickets}`;
    console.log(this.winningTeam, this.finalScore)

    if(!this.league.winner) { 
      console.log(this.league.winner, this.winningTeam)
      this.league['winner'] = this.winningTeam
      console.log(this.league);
      delete this.winningTeam.logo;
      this.dataService.updateLeague(this.league, this.league.id)
    }
  }

  // ngOnChanges(changes: any) {
  //   console.log(this.league.winner, this.winningTeam)
  //   if(!this.league.winner) { 
  //     console.log(this.league.winner, this.winningTeam)
  //     this.league['winner'] = this.winningTeam
  //     this.dataService.updateLeague(this.league, this.league.id)
  //   }
  // } 

  
  startConfetti() {
    setInterval(() => {
      this.createConfettiPiece();
    }, 200); // Continuously generates confetti
  }

  createConfettiPiece() {
    const colors = ['#FFD700', '#E31B23', '#1A2B4D', '#FFFFFF'];
    const confetti = this.renderer.createElement('div');
    this.renderer.addClass(confetti, 'confetti');

    // Set random properties
    const size = Math.random() * 10 + 5 + 'px';
    confetti.style.width = size;
    confetti.style.height = size;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + 'vw'; // Random position across the screen
    confetti.style.top = '-10vh'; // Start above the screen
    confetti.style.opacity = (Math.random() + 0.5).toString(); // Ensures some visibility

    // Apply animation
    confetti.style.position = 'fixed';
    confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear`;

    this.renderer.appendChild(document.body, confetti);

    // Remove confetti after animation completes
    setTimeout(() => {
      this.renderer.removeChild(document.body, confetti);
    }, 5000);
  }
}
