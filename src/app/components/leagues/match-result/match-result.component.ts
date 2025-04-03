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

  ngOnChanges(): void {
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

    if(this.isH2H) {
      await this.dataService.updateH2HResult(payload, this.match.id)
    } else {
      await this.dataService.updateMatchResult(payload, this.match.id)
    }
    this.messageService.add({ severity: 'success', summary: 'Match', detail: 'Match Result Updated!' });
    this.isLoading = false;
    this.team_one.reset();
    this.team_two.reset();
    this.closeMatchResultModal.emit(this.match); 
  }
}
