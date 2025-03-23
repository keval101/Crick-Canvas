import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-setup-team',
  templateUrl: './setup-team.component.html',
  styleUrls: ['./setup-team.component.scss']
})
export class SetupTeamComponent {
  @Output() closeSetupTeamModal = new EventEmitter<void>();
  teamForm: FormGroup;
  showSuccessModal: boolean = false;
  logoPreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private authService: AuthService) {}

  ngOnInit(): void {
    this.teamForm = this.fb.group({
      teamName: ['', [Validators.required]],
      logo: [null, [Validators.required]],
      leagueCode: ['', [Validators.required]],
    });

    this.authService.getCurrentUser().subscribe(user => {
      // this.userId = user.uid;
      console.log(user)
    })
  }

  // Handle file input change (logo upload)
  onLogoChange(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files ? fileInput.files[0] : null;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result;
        console.log(this.logoPreview);
        this.teamForm.patchValue({ logo: file });
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle form submission
  onSubmit(): void {
    if (this.teamForm.invalid) return;
    this.showSuccessModal = true;
    this.closeSetupTeamModal.emit();
  }

  // Close the success modal
  closeModal(): void {
    this.showSuccessModal = false;
    this.teamForm.reset();
    this.logoPreview = null;
  }
}
