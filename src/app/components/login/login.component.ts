import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  loginForm: FormGroup;
  seePassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    })
  }

  login() {
    this.isLoading = true;
    if(this.loginForm.valid) {
      this.authService.signIn(this.loginForm.value).then((res: any) => {
        const token = res.user.multiFactor.user.accessToken
        const userId = res.user.multiFactor.user.uid
        localStorage.setItem('userId', userId);
        localStorage.setItem('token', token);
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Logged In', detail: 'Logged In Successfully!' });
        this.router.navigate(['/dashboard'])
      }).catch(error => {
        if(error.message.includes('invalid-credential')) {
          this.messageService.add({ severity: 'error', summary: 'Invalid Credential', detail: 'Invalid Credential' });
        } else if(error.message.includes('invalid-email')) {
          this.messageService.add({ severity: 'error', summary: 'Invalid Email', detail: 'The email address is Invalid' });
        }
      })
    }
  }
}
