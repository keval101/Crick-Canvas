import { Component } from '@angular/core';

@Component({
  selector: 'app-coin-toss',
  templateUrl: './coin-toss.component.html',
  styleUrls: ['./coin-toss.component.scss']
})
export class CoinTossComponent {

  
  
  
  deferFn(callback, ms) {
    setTimeout(callback, ms); 
  }

  flipCoin() {
    const coin = document.querySelector('#coin');
    coin.setAttribute('class', '');
    const random = Math.random();
    const result = random < 0.5 ? 'heads' : 'tails';
   this.deferFn(function() {
     coin.setAttribute('class', 'animate-' + result);
   }, 100);
  }
}
