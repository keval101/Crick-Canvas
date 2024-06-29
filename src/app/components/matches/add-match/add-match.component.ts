import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-add-match',
  templateUrl: './add-match.component.html',
  styleUrls: ['./add-match.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddMatchComponent {
  @Output() close = new EventEmitter();
  players$ = new BehaviorSubject([]);
  teams$ = new BehaviorSubject([]);
  date = new Date();

  matchForm: FormGroup
  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private datepipe: DatePipe,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.matchForm = this.fb.group({
      team1: [''],
      team2: [''],
      overs: [''],
      oversPerBowler: [''],
      date: [''],
      venue: [''],
      outBatsman: [[]]
    })
    this.getUsers();
    this.getTeams();
  }

  getTeams() {
    this.dataService.getTeams().subscribe(teams => {
      this.teams$.next(teams)
    })
  }

  getUsers() {
    this.dataService.getPlayers().subscribe(players => {
      this.players$.next(players)
    })
  }

  async createMatch() {
    let payload = this.matchForm.value;
    const userId = localStorage.getItem('userId')
    payload = {...payload, userId: userId}
    payload.date = this.datepipe.transform(this.date, 'dd/MM/yyyy');
    const response = await this.dataService.createMatch(payload)
    this.messageService.add({ severity: 'success', summary: 'Match', detail: 'Created Successfully!' });
    this.router.navigate(['/matches', response.id])
    this.close.emit();
  }
}
