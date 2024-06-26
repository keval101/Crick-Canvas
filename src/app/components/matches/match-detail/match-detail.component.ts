import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
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
  selectBowler = false;
  toss = false;
  currentBall = 0;
  battingTeam: string;
  bowlingTeam: string;
  strikerForm: FormGroup;
  bowlerForm: FormGroup;
  tossForm: FormGroup;

  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute) {
    
      this.strikerForm = this.fb.group({
        striker: '',
        nonStriker: '',
      })

      this.bowlerForm = this.fb.group({
        bowler: '',
      })

      this.tossForm = this.fb.group({
        winTheToss: '',
        selected: '',
      })
  }

  
  ngOnInit() {
    this.matchId = this.route.snapshot.params['matchId'];
    this.getMatchDetail();
  }

  openStriker() {
    this.selectStriker = true;
  }

  saveStriker() {
    const payload = {...this.match, ...this.strikerForm.value}
    this.dataService.updateMatch(payload)
    this.selectStriker = false;
  }

  openBowler() {
    this.selectBowler = true;
  }

  saveBowler() {
    const payload = {...this.match, ...this.bowlerForm.value}
    this.dataService.updateMatch(payload)
    this.selectBowler = false;
  }

  openTheToss() {
    this.toss = true;
  }

  saveTheToss() {
    const payload = {...this.match, toss: {...this.tossForm.value}}
    payload['isStarted'] = true;
    this.dataService.updateMatch(payload)
    this.getMatchDetail();
    this.toss = false;
  }

  getMatchDetail() {
    this.dataService.getMatch(this.matchId).subscribe(match => {
      this.match = match;

      if(this.match.bowler) {
        const balls = this.match.bowler.over > 0 ? this.match.bowler.over.split('.')?.[1] : 0;
        if(balls) {
          this.currentBall = +balls;
        }
      }

      if(this.match.toss) {
        const winningTossTeam = this.match.toss.winTheToss;
        const lossingTossTeam = this.match.toss.winTheToss === 'team1' ? 'team2' : 'team1';
        this.battingTeam = this.match.toss.selected == 'Bat First' ? winningTossTeam : lossingTossTeam;
        this.bowlingTeam = this.match.toss.selected == 'Bowl First' ? winningTossTeam : lossingTossTeam;
      }

      console.log(this.match)

    })
  }

  getPlayers() {
    this.dataService.getPlayers().subscribe(players => {
      this.players$.next(players)
    })
  }



  setBowling(score) {
    const striker = this.match.striker;
    const nonStriker = JSON.parse(JSON.stringify(this.match.nonStriker));
    const strikerIndex = this.match[this.battingTeam].players.findIndex(x => x.uid === striker.uid)
    const nonStrikerIndex = this.match[this.battingTeam].players.findIndex(x => x.uid === nonStriker.uid)
    const bowler = this.match.bowler;
    const bowlerIndex = this.match[this.bowlingTeam].players.findIndex(x => x.uid === bowler.uid);

    // handle bowlers runs
    const strikerMatch = this.match[this.battingTeam].players[strikerIndex]?.matches?.filter(x => x.matchId === this.match.id) ?? [];
    const strikerDetail = strikerMatch.length ? strikerMatch[0] : {};
    const strikerRuns = {
      ...strikerDetail,
      matchId: this.match.id,
      runs: strikerDetail.runs > 0 ? strikerDetail.runs + +score : score, 
      balls: strikerDetail.balls > 0 ? strikerDetail.balls + 1 : 1,
    }

    if(score === 6) {
      strikerRuns['sixes'] = strikerDetail.sixes > 0 ? strikerDetail.sixes + 1 : 1;
    } else if(score === 4) {
      strikerRuns['fours'] = strikerDetail.fours > 0 ? strikerDetail.fours + 1 : 1;
    }

    const matchIndex = this.match[this.battingTeam].players[strikerIndex]?.matches?.findIndex(x => x.matchId === this.match.id);

    if(matchIndex != -1 && matchIndex >= 0) {
      this.match[this.battingTeam].players[strikerIndex].matches[matchIndex] = strikerRuns;
    } else {
      this.match[this.battingTeam].players[strikerIndex]['matches'] = [strikerRuns];
    }


   // handle bowlers runs/balls
   this.currentBall = this.currentBall + 1

   const bowlerMatch = this.match[this.bowlingTeam].players[bowlerIndex]?.matches?.filter(x => x.matchId === this.match.id) ?? [];
   const bowlerDetail = bowlerMatch.length ? bowlerMatch[0] : {};

   const bowlerRuns = {
    ...bowlerDetail,
    matchId: this.match.id,
    runs: bowlerDetail.runs > 0 ? bowlerDetail.runs + +score : score, 
    balls: bowlerDetail.balls > 0 ? bowlerDetail.balls + 1 : 1,
  }

   if(score === 'OUT') {
      bowler['wickets'] = bowler?.wicket ? +bowler.wicket + 1 : 1; 
      bowlerRuns.wickets = bowler.wickets;
    } else {
      bowler['runs'] = bowler?.runs > 0 ? bowler.runs + +score : score;
      bowlerRuns.runs = bowler.runs;
    }

    if(this.currentBall === 6) {
      const over = this.match.bowler?.over?.split('.')?.[0] ?? 0
      bowler['over'] = bowler.over > 0 ? `${+over + 1}.0` : '1.0';
      bowlerRuns.over =  bowler.over;
    } else {
      const over = this.match.bowler?.over?.split('.')?.[0] ?? 0
      bowler['over'] = bowler.over > 0 ? `${over}.${this.currentBall}` : `0.${this.currentBall}`;
      bowlerRuns.over =  bowler.over;
    }

    const matchBwIndex = this.match[this.bowlingTeam].players[bowlerIndex]?.matches?.findIndex(x => x.matchId === this.match.id);

    if(matchBwIndex != -1 && matchBwIndex >= 0) {
      this.match[this.bowlingTeam].players[bowlerIndex].matches[matchBwIndex] = bowlerRuns
    } else {
      this.match[this.bowlingTeam].players[bowlerIndex]['matches'] = [bowlerRuns];
    }
    

    this.match.striker = {...this.match.striker, ...strikerRuns};
    this.match.bowler = {...this.match.bowler, ...bowlerRuns};

    // this.match.team1.players[strikerIndex].runs = this.match.team1.players[strikerIndex].runs > 0 ? this.match.team1.players[strikerIndex].runs + +score : score;
    // this.match.team1.players[strikerIndex].balls = this.match.team1.players[strikerIndex].balls > 0 ? this.match.team1.players[strikerIndex].balls + 1 : 1
    // if(score === 6) {
    //   this.match.team1.players[strikerIndex].sixes = this.match.team1.players[strikerIndex].sixes > 0 ? this.match.team1.players[strikerIndex].sixes + 1 : 1;
    // } else if(score === 4) {
    //   this.match.team1.players[strikerIndex].fours = this.match.team1.players[strikerIndex].fours > 0 ? this.match.team1.players[strikerIndex].fours + 1 : 1;
    // }

    if(score === 1 || this.currentBall === 6) {
      this.match.nonStriker = this.match.striker;
      this.match.striker = nonStriker;
    }

    this.currentBall = this.currentBall === 6 ? 0 : this.currentBall;

    this.match['team1Score'] = this.match['team1Score'] > 0 ? +this.match['team1Score'] + 1 : 0;
    const payload = {...this.match, bowler}

    const batsmanPlayer = this.match[this.battingTeam].players[strikerIndex];
    const bowlingPlayer = this.match[this.bowlingTeam].players[bowlerIndex];

    // this.dataService.updatePlayer(batsmanPlayer)
    // this.dataService.updatePlayer(bowlingPlayer)

    console.log('strikerIndex', {batsmanPlayer, bowlingPlayer})
    console.log('------', payload)

    // this.dataService.updateMatch(payload)
  }




  calculateStrikeRate(totalRuns, totalBallsFaced) {
    if (totalBallsFaced === 0) { return 0;}
    return !isNaN((totalRuns / totalBallsFaced) * 100) ? ((totalRuns / totalBallsFaced) * 100).toFixed(2) : 0;
  }

  calculateEconomy(overs, runs) {
    const oversFloat = parseFloat(overs);
    const economy = (runs / oversFloat) * 6;
    const economyRounded = economy.toFixed(2);
    return !isNaN(economy) ? economyRounded : 0;
  }

  async deleteMatch() {
    if (confirm('Are you sure to delte match?') == true) {
      await this.dataService.deleteMatch(this.matchId);
      this.messageService.add({ severity: 'success', summary: 'Match', detail: 'Deleted Successfully!' });
      this.router.navigate(['/matches'])
    }
  }
}
