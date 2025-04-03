import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { ImageUploadService } from 'src/app/services/image-upload.service';

@Component({
  selector: 'app-setup-team',
  templateUrl: './setup-team.component.html',
  styleUrls: ['./setup-team.component.scss']
})
export class SetupTeamComponent {
  @Output() closeSetupTeamModal = new EventEmitter<void>();
  @Input() isProfile = false;
  @Input() data: any;
  teamForm: FormGroup;
  showSuccessModal: boolean = false;
  logoPreview: string | ArrayBuffer | null = null;
  logo: any;
  user: any;
  isLoading = false

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private imageUploadService: ImageUploadService,
    private messageService: MessageService,
    private authService: AuthService) {}

  ngOnInit(): void {
    this.teamForm = this.fb.group({
      teamName: ['', [Validators.required]],
      logo: [null, [Validators.required]],
      leagueCode: ['', [Validators.required]],
    });



    this.authService.getCurrentUserDetail().subscribe(user => {
      this.user = user;
      if(this.user?.team) {
        this.teamForm.get('teamName').setValue(this.user?.team?.name)
        this.teamForm.get('logo').setValue(this.user?.team?.logo)
        this.logoPreview = this.user?.team?.logo;
      }

      if(this.isProfile) { 
        this.teamForm.removeControl('leagueCode');
      }
    })
  }

  // Handle file input change (logo upload)
  onLogoChange(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files ? fileInput.files[0] : null;
    this.logo = file;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result;
        this.teamForm.patchValue({ logo: file });
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle form submission
  onSubmit(): void {
    if (this.teamForm.invalid) return;

    if(this.isProfile) {
      this.onUpload()
    } else {
      this.findLeague();
    }
  }

  async joinLeague(league) {
    this.isLoading = true;
    league.teams.push(this.user.uid);
    const payload = { ...league}
    await this.dataService.joinLeague(payload, league?.id);
    this.messageService.add({ severity: 'success', summary: 'League', detail: 'Joined Successfully!' });
    this.isLoading = false;
    this.closeSetupTeamModal.emit();
  }

  async findLeague() {
    this.isLoading = true;
    this.dataService.getLeague(this.teamForm.value.leagueCode).then((league) => {
      this.joinLeague(league);
    })
  }

  async onUpload() {
    this.isLoading = true;
    if (this.logo) {
      this.imageUploadService.convertBlobToBase64(this.logo).subscribe(async (downloadURL) => {
        const payload = { ...this.user, team: { name: this.teamForm.value.teamName, logo: downloadURL } }
        await this.dataService.updateUserDetail(payload, this.user.uid);
        this.messageService.add({ severity: 'success', summary: 'Team', detail: 'Saved Successfully!' });
        this.isLoading = false;
        this.closeSetupTeamModal.emit();
      });
    } else if(this.logoPreview) {
      const payload = { ...this.user, team: { name: this.teamForm.value.teamName, logo: this.logoPreview } }
      await this.dataService.updateUserDetail(payload, this.user.uid);
      this.isLoading = false;
      this.messageService.add({ severity: 'success', summary: 'Team', detail: 'Saved Successfully!' });
      this.closeSetupTeamModal.emit();
    }
  }

  // Close the success modal
  closeModal(): void {
    this.showSuccessModal = false;
    this.teamForm.reset();
    this.logoPreview = null;
  }
}
