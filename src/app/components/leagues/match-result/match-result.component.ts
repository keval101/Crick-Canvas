import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-match-result',
  templateUrl: './match-result.component.html',
  styleUrls: ['./match-result.component.scss']
})
export class MatchResultComponent {

  @Output() closeMatchResultModal = new EventEmitter<void>();
  @Input() match: any;
  @Input() isH2H = false;
  team_one: FormGroup
  team_two: FormGroup
  isLoading = false;
  team_one_performance: any;
  team_two_performance: any;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private messageService: MessageService
  ) {

    this.team_one = this.fb.group({
      runs: [''],
      wickets: [''],
      balls: ['']
    })

    this.team_two = this.fb.group({
      runs: [''],
      wickets: [''],
      balls: ['']
    })
  }

  async ngOnChanges() {
    if(this.match?.team_one?.id && this.match?.team_two?.id) {
      this.team_one_performance = await this.dataService.getPlayerPerformance(this.match.league_id, this.match.team_one.id)
      this.team_two_performance = await this.dataService.getPlayerPerformance(this.match.league_id, this.match.team_two.id)

      // if(this.match.team_one.runs > 0) {
      //   this.team_one.patchValue(this.match.team_one)
      // }
      // if(this.match.team_two.runs > 0) {
      //   this.team_two.patchValue(this.match.team_two)
      // }
    }
  }

  ngOnInit() {
  }

  swapResults() {
    const teamOne = JSON.parse(JSON.stringify(this.team_one.value))
    const teamTwo = JSON.parse(JSON.stringify(this.team_two.value))

    this.team_one.patchValue(teamTwo)
    this.team_two.patchValue(teamOne)
  }

  async submitMatchResult() {
    this.isLoading = true;
    const payload = {
      ...this.match,
      team_one: {...this.match.team_one, ...this.team_one.value},
      team_two: {...this.match.team_two, ...this.team_two.value},
      status: 'completed',
      date: new Date().getTime()
    }

    this.match = payload

    
    const teamOneWinner = this.getTeamResult(payload, this.match.team_one.id === this.team_one_performance.id ? 'teamOne' : 'teamTwo');
    const teamTwoWinner = this.getTeamResult(payload, this.match.team_one.id === this.team_two_performance.id ? 'teamOne' : 'teamTwo');
    const teamOne =  this.match.team_one.id === this.team_one_performance.id ? this.match.team_one: this.match.team_two;
    const teamTwo =  this.match.team_two.id === this.team_one_performance.id ? this.match.team_one: this.match.team_two;

    const team_one_performance = {
      id: this.team_one_performance.id,
      team: this.team_one_performance.team ? this.team_one_performance.team : this.match.team_one.id === this.team_one_performance.id ? this.match.team_one.name : this.match.team_two.name,
      played: (this.team_one_performance?.played ?? 0) + 1,
      win: (this.team_one_performance?.win ?? 0) + (teamOneWinner === 'W' ? 1 : 0),
      loss: (this.team_one_performance?.loss ?? 0) + (teamOneWinner === 'L' ? 1 : 0),
      draw: (this.team_one_performance?.draw ?? 0) + (teamOneWinner === 'D' ? 1 : 0),
      runsFor: (this.team_one_performance?.runsFor ?? 0) + (teamOne?.runs ?? 0),
      wicketsTaken: (this.team_one_performance?.wicketsTaken ?? 0) + (teamTwo?.wickets ?? 0),
      wicketsFallen: (this.team_one_performance?.wicketsFallen ?? 0) + (teamOne?.wickets ?? 0),
      oversFaced: this.addOvers(this.team_one_performance.oversFaced, +this.ballsToOvers(teamOne.balls)),  
      runsAgainst: (this.team_one_performance?.runsAgainst ?? 0) + (teamTwo?.runs ?? 0),
      oversBowled: this.addOvers(this.team_one_performance.oversBowled, +this.ballsToOvers(teamTwo.balls)),
      scores: this.team_one_performance?.scores?.length ? this.team_one_performance?.scores : [],
    }

    const teamOneScore = {
      ballsBowled: teamTwo.balls,
      ballsFaced: teamOne.balls,
      runs: teamOne.runs,
      runsConceded: teamTwo.runs,
      wicketsFallen: teamOne.wickets,
      wicketsTaken: teamTwo.wickets,
      result: teamOneWinner
    }

    team_one_performance.scores.unshift(teamOneScore)

    const team_two_performance = {
      id: this.team_two_performance.id,
      team: this.team_two_performance.team ? this.team_two_performance.team : this.match.team_one.id === this.team_two_performance.id ? this.match.team_one.name : this.match.team_two.name,
      played: (this.team_two_performance?.played ?? 0) + 1,
      win: (this.team_two_performance?.win ?? 0) + (teamTwoWinner === 'W' ? 1 : 0),
      loss: (this.team_two_performance?.loss ?? 0) + (teamTwoWinner === 'L' ? 1 : 0),
      draw: (this.team_two_performance?.draw ?? 0) + (teamTwoWinner === 'D' ? 1 : 0),
      runsFor: (this.team_two_performance?.runsFor ?? 0) + (teamTwo?.runs ?? 0),
      wicketsTaken: (this.team_two_performance?.wicketsTaken ?? 0) + (teamOne?.wickets ?? 0),
      wicketsFallen: (this.team_two_performance?.wicketsFallen ?? 0) + (teamTwo?.wickets ?? 0),
      oversFaced: this.addOvers(this.team_two_performance.oversFaced, +this.ballsToOvers(teamTwo.balls)),  
      runsAgainst: (this.team_two_performance?.runsAgainst ?? 0) + (teamOne?.runs ?? 0),
      oversBowled: this.addOvers(this.team_two_performance.oversBowled, +this.ballsToOvers(teamOne.balls)),  
      scores: this.team_two_performance?.scores?.length ? this.team_two_performance?.scores : [],
    }

    const teamTwoScore = {
      ballsBowled: teamOne.balls,
      ballsFaced: teamTwo.balls,
      runs: teamTwo.runs,
      runsConceded: teamOne.runs,
      wicketsFallen: teamTwo.wickets,
      wicketsTaken: teamOne.wickets,
      result: teamTwoWinner
    }

    team_two_performance.scores.unshift(teamTwoScore)


    if(this.isH2H) {
      await this.dataService.updateH2HResult(payload, this.match.id)
    } else {
      team_one_performance.scores = team_one_performance.scores?.length > 10 ? team_one_performance.scores.slice(0, 10) : team_one_performance.scores
      team_two_performance.scores = team_two_performance.scores?.length > 10 ? team_two_performance.scores.slice(0, 10) : team_two_performance.scores
      await this.dataService.updatePlayerPerformance(this.match.league_id, this.team_one_performance.id, team_one_performance)
      await this.dataService.updatePlayerPerformance(this.match.league_id, this.team_two_performance.id, team_two_performance)
      await this.dataService.updateMatchResult(payload, this.match.id)
    }
    this.messageService.add({ severity: 'success', summary: 'Match', detail: 'Match Result Updated!' });
    this.isLoading = false;
    this.team_one.reset();
    this.team_two.reset();
    this.closeMatchResultModal.emit(this.match); 
  }

  async matchAbandon() {
    this.team_one.reset();
    this.team_two.reset();

    this.isLoading = true;
    const payload = {
      ...this.match,
      team_one: {...this.match.team_one, ...this.team_one.value},
      team_two: {...this.match.team_two, ...this.team_two.value},
      status: 'completed',
      result: 'abandoned',
      date: new Date().getTime()
    }

    if(this.isH2H) {
      await this.dataService.updateH2HResult(payload, this.match.id)
    } else {
      await this.dataService.updateMatchResult(payload, this.match.id)
    }
    this.closeMatchResultModal.emit(this.match);
    this.messageService.add({ severity: 'success', summary: 'Match', detail: 'Match Abondoned!' });
    this.isLoading = false;
  }

  getTeamResult(match, teamKey) {
    const isAbandoned = match.result === 'abandoned';
    const teamOneRuns = this.team_one_performance.id === this.match.team_one.id ? this.match.team_one.runs : this.match.team_two.runs;
    const teamTwoRuns = this.team_two_performance.id === this.match.team_one.id ? this.match.team_one.runs : this.match.team_two.runs;

    if (isAbandoned) return 'D';
  
    if (teamKey === 'teamOne') {
      if (teamOneRuns > teamTwoRuns) return 'W';
      if (teamOneRuns < teamTwoRuns) return 'L';
      return 'D';
    }
  
    if (teamKey === 'teamTwo') {
      if (teamTwoRuns > teamOneRuns) return 'W';
      if (teamTwoRuns < teamOneRuns) return 'L';
      return 'D';
    }
  
    return 'D'; // default fallback
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

addOvers(previousOvers: number, currentOvers: number): string {
  // Helper: convert overs (e.g., 248.1) to total balls
  const oversToBalls = (overs: number): number => {
    if(overs) {
      const fullOvers = Math.floor(overs);
      const balls = Math.round((overs - fullOvers) * 10); // e.g. 0.4 => 4 balls
      return (fullOvers * 6) + balls;
    } else {
      return 0;
    }
  };

  // Helper: convert total balls back to overs format (e.g., 250.4)
  const ballsToOvers = (balls: number): string => {
    const fullOvers = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${fullOvers ?? 0}.${remainingBalls ?? 0}`;
  };

  const totalBalls =
    oversToBalls(previousOvers) + oversToBalls(currentOvers);

  return ballsToOvers(totalBalls);
}

}
