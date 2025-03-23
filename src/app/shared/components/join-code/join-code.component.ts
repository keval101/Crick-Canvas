import { Component } from '@angular/core';

@Component({
  selector: 'app-join-code',
  templateUrl: './join-code.component.html',
  styleUrls: ['./join-code.component.scss']
})
export class JoinCodeComponent {
  joinCode: string[] = ['', '', '', '', '', ''];

  constructor() {}

  ngOnInit(): void {}

  // This method handles the input event (for typing and backspace)
  moveFocus(event: any, index: number) {
    const value = event.target.value;

    // Handle forward focus when a value is entered
    if (value.length === 1 && index < 5) {
      const nextInput = document.getElementById(`joinCode-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Handle backward focus when backspace is pressed
    if (value === '' && event.inputType === 'deleteContentBackward' && index > 0) {
      const prevInput = document.getElementById(`joinCode-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }
}
