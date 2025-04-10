import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-add-head-to-head',
  templateUrl: './add-head-to-head.component.html',
  styleUrls: ['./add-head-to-head.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddHeadToHeadComponent {
  @Input() length: any = 0;
  matchForm!: FormGroup;
  teams: any[] = [];
  teamOne: any[] = [];
  teamTwo: any[] = [];
  isLoading = false;
  @Output() close = new EventEmitter();
  destroy$ = new Subject<void>();
  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.matchForm = this.fb.group({
      team_one: ['', Validators.required],
      team_two: ['', Validators.required],
      date: ['',Validators.required],
    })
    this.authService.getCurrentUserDetail().pipe(takeUntil(this.destroy$)).subscribe(user => {
      if(user) {
        this.matchForm.get('team_one').setValue(user?.uid);
      }
      this.getTeams();
    })
  }

  getTeams() {
    this.dataService.getAllUsers().then(teams => {
      this.teams = teams;
      this.teamOne = teams;
      this.teamTwo = teams;
      this.updateTeamTwoDropdown();
    })
  }

  async createMatch() {
    const match = {
      id: `${this.matchForm.value.team_one}_${this.length + 1}`, 
      status: 'upcoming',
      match_number: this.length + 1,
      team_one: {
        balls: 0,
        wickets: 0,
        id: this.matchForm.value.team_one,
        runs: 0
      },
      team_two: {
        balls: 0,
        wickets: 0,
        id: this.matchForm.value.team_two,
        runs: 0
      },
    }

    await this.dataService.saveH2HToFirebase(match)
    this.messageService.add({ severity: 'success', summary: 'Match', detail: 'Created Successfully!' });
    this.close.emit();
  }

  updateTeamTwoDropdown() {
    this.teamTwo = this.teams.filter(x => x.uid != this.matchForm.value.team_one.uid)
  }

  updateTeamOneDropdown() {
    this.teamOne = this.teams.filter(x => x.uid != this.matchForm.value.team_two.uid)
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
}
