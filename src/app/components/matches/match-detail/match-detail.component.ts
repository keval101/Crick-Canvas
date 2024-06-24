import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent {

  players$ = new BehaviorSubject([]);

  matchId: string;
  match: any;
  selectStriker = false;
  currentBall = 0;

  strikerForm: FormGroup;
  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
    private route: ActivatedRoute) {
    
      this.strikerForm = this.fb.group({
        striker: '',
        nonStriker: '',
        bowler: '',
      })
  }

  openStriker() {
    this.selectStriker = true;
  }

  ngOnInit() {
    this.matchId = this.route.snapshot.params['matchId'];
    console.log(this.matchId)
    this.getMatchDetail();
  }

  getMatchDetail() {
    this.dataService.getMatch(this.matchId).subscribe(match => {
      this.match = match;
      console.log('m', this.match)
    })
  }

  getPlayers() {
    this.dataService.getPlayers().subscribe(players => {
      this.players$.next(players)
    })
  }

  saveStriker() {
    console.log(this.strikerForm.value)
    const payload = {...this.match, ...this.strikerForm.value}
    payload['isStarted'] = true;
    this.dataService.updateMatch(payload)
    this.selectStriker = false;
  }

  calculateStrikeRate(totalRuns, totalBallsFaced) {
    if (totalBallsFaced === 0) {
        return 0; // To avoid division by zero
    }
    return !isNaN((totalRuns / totalBallsFaced) * 100) ? (totalRuns / totalBallsFaced) * 100 : 0;
  }

  calculateEconomy(overs, runs) {
    // Convert overs to a float number
    const oversFloat = parseFloat(overs);
    
    // Calculate economy rate
    const economy = (runs / oversFloat) * 6;
    
    // Round to two decimal places
    const economyRounded = economy.toFixed(2);
    
    return !isNaN(economy) ? economyRounded : 0;
  }

  setBowling(score) {
   const bowler = this.match.bowler;
   this.currentBall = this.currentBall + 1

   if(score === 'OUT') {
      bowler['wickets'] = bowler?.wicket ? +bowler.wicket + 1 : 1; 
    } else {
      bowler['runs'] = bowler?.runs > 0 ? bowler.runs + +score : score;
    }
    if(this.currentBall === 6) {
      bowler.over = bowler.over > 0 ? bowler.over + 1 : 1;
    }
    const index = this.match.team2.players.findIndex(x => x.uid === bowler.uid)
    this.match.team2.players[index] = bowler
    const payload = {...this.match, bowler}
    this.dataService.updateMatch(payload)
  }

}
