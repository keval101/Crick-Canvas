import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  signupForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      bat: ['', Validators.required],
      bowl: ['', Validators.required],
      password: ['', Validators.required],
      type: ['', Validators.required],
      matches: [[]]
    })
  }

  signup() {
    if(this.signupForm.valid) {
      const payload = {
        email: this.signupForm.value.email,
        password: this.signupForm.value.password
      }
      this.authService.signup(payload.email, payload.password).then(res => {
        const user = res.user.multiFactor.user;
        const data = this.signupForm.value;
        data['uid'] = user.uid
        this.authService.storeUserData(user.uid, data)
        this.messageService.add({ severity: 'success', summary: 'Register', detail: 'Register Successfully!' });
        this.router.navigate(['/dashboard']);
      }).catch(error => {
        if(error.message.includes('weak-password')) {
          this.messageService.add({ severity: 'error', summary: 'Week Password', detail: 'Password should be at least 6 characters' });
        } else if(error.message.includes('invalid-email')) {
          this.messageService.add({ severity: 'error', summary: 'Invalid Email', detail: 'The email address is Invalid' });
        }  else if(error.message.includes('email-already-in-use')) {
          this.messageService.add({ severity: 'error', summary: 'Email Already In Use', detail: 'The email address is already in use by another account' });
        }
      })
    }
  }
}
