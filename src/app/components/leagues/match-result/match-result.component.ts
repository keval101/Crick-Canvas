import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-match-result',
  templateUrl: './match-result.component.html',
  styleUrls: ['./match-result.component.scss']
})
export class MatchResultComponent {

  @Output() closeMatchResultModal = new EventEmitter<void>();

  team_one: FormGroup
  team_two: FormGroup

  constructor(
    private fb: FormBuilder
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

  ngOnInit(): void {}
}
