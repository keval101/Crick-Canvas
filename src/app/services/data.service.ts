import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class DataService {

  constructor(private firestore: AngularFirestore) {}
  api: string;

  // --------------------------------------- Players ---------------------------------------
  getUsers(): Observable<any> {
    // this.setUserId();

    return this.firestore
      .collection(`/users`)
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data: any = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id };
          });
        })
      );
  }

  // --------------------------------------- Trade API ---------------------------------------
  // getTrades(): Observable<any> {
  //   this.setUserId();

  //   return this.firestore
  //     .collection(`${this.api}/trades`)
  //     .snapshotChanges()
  //     .pipe(
  //       map((actions) => {
  //         return actions.map((a) => {
  //           const data: any = a.payload.doc.data();
  //           const id = a.payload.doc.id;
  //           return { ...data, id };
  //         });
  //       })
  //     );
  // }

  async createTeam(payload: any) {
    this.setUserId();
    const response = await this.firestore.collection(`${this.api}/teams`).add(payload);
    console.log(response);
    return response
  }

  // updateTrade(tradeId: string, payload: any) {
  //   this.setUserId();
  //   return this.firestore
  //     .collection(`${this.api}/trades`)
  //     .doc(tradeId)
  //     .set(payload, { merge: true });
  // }

  // deleteTrade(tradeId: string) {
  //   this.setUserId();
  //   return this.firestore.collection(`${this.api}/trades`).doc(tradeId).delete();
  // }

  setUserId() {
    const userId = localStorage.getItem('userId');
    console.log(userId)
    this.api = `users/${userId}`
  }

}