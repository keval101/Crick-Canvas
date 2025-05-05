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
    console.log(this.match)
    if(this.match?.team_one?.id && this.match?.team_two?.id) {
      this.team_one_performance = await this.dataService.getPlayerPerformance(this.match.league_id, this.match.team_one.id)
      this.team_two_performance = await this.dataService.getPlayerPerformance(this.match.league_id, this.match.team_two.id)
    
      console.log(this.team_one_performance, this.team_two_performance)
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
      runsFor: (this.team_one_performance?.draw ?? 0) + (teamOne?.runs ?? 0),
      wicketsTaken: (this.team_one_performance?.wicketsTaken ?? 0) + (teamTwo?.wickets ?? 0),
      wicketsFallen: (this.team_one_performance?.wicketsFallen ?? 0) + (teamOne?.wickets ?? 0),
      oversFaced: (Number(this.team_one_performance.oversBowled ?? 0)) + (+this.ballsToOvers(teamOne.balls)),  
      runsAgainst: (this.team_one_performance?.draw ?? 0) + (teamTwo?.runs ?? 0),
      oversBowled: (Number(this.team_one_performance.oversBowled ?? 0)) + (+this.ballsToOvers(teamTwo.balls)),  
    }

    const team_two_performance = {
      id: this.team_two_performance.id,
      team: this.team_two_performance.team ? this.team_two_performance.team : this.match.team_one.id === this.team_two_performance.id ? this.match.team_one.name : this.match.team_two.name,
      played: (this.team_two_performance?.played ?? 0) + 1,
      win: (this.team_two_performance?.win ?? 0) + (teamTwoWinner === 'W' ? 1 : 0),
      loss: (this.team_two_performance?.loss ?? 0) + (teamTwoWinner === 'L' ? 1 : 0),
      draw: (this.team_two_performance?.draw ?? 0) + (teamTwoWinner === 'D' ? 1 : 0),
      runsFor: (this.team_two_performance?.draw ?? 0) + (teamTwo?.runs ?? 0),
      wicketsTaken: (this.team_two_performance?.wicketsTaken ?? 0) + (teamOne?.wickets ?? 0),
      wicketsFallen: (this.team_two_performance?.wicketsFallen ?? 0) + (teamTwo?.wickets ?? 0),
      oversFaced: (Number(this.team_two_performance.oversBowled ?? 0)) + (+this.ballsToOvers(teamTwo.balls)),  
      runsAgainst: (this.team_two_performance?.draw ?? 0) + (teamOne?.runs ?? 0),
      oversBowled: (Number(this.team_two_performance.oversBowled ?? 0)) + (+this.ballsToOvers(teamOne.balls)),  
    }

    console.log(team_one_performance, team_two_performance)

    if(this.isH2H) {
      await this.dataService.updateH2HResult(payload, this.match.id)
    } else {
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
}
