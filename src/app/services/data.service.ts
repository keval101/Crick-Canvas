import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class DataService {

  constructor(
    private firestore: AngularFirestore,
    private http: HttpClient) {}
  api: string;

  // --------------------------------------- Players ---------------------------------------
  getPlayers(): Observable<any> {
    return this.firestore
      .collection(`/users`)
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data: any = a.payload.doc.data();
            const id = a.payload.doc.id;
            delete data.password
            const object = {
              name: data.name,
              bowl: data.bowl,
              email: data.email,
              type: data.type,
              bat: data.bat,
              uid: data.uid,
              id: data.id,
              matches: data.matches,
            }
            return { ...object, id };
          });
        })
      );
  }

  // --------------------------------------- Trade API ---------------------------------------

  async createTeam(payload: any) {
    this.setUserId();
    const response = await this.firestore.collection(`${this.api}/teams`).add(payload);
    return response
  }

  async createMatch(payload: any) {
    const response = await this.firestore.collection(`matches`).add(payload);
    return response
  }

  getMatch(matchId: string) {
    this.setUserId();
    return this.firestore.collection(`matches`).doc(matchId).snapshotChanges()
    .pipe(
      map((doc: any) => {
        if (doc.payload.exists) {
          const data = doc.payload.data();
          const id = doc.payload.id;
          return { id, ...data };
        } else {
          return null;
        }
      })
    );
  }

  getMatchDetail(matchId: string) {
    return this.http.get(`https://firestore.googleapis.com/v1/projects/cricketscore-562db/databases/(default)/documents/matches/${matchId}.json`)
  }

  getTeams(): Observable<any> {
    this.setUserId();
    this.getLeagues();

    return this.firestore
      .collection(`${this.api}/teams`)
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

  getMatches(): Observable<any> {
    this.setUserId();

    return this.firestore
      .collection(`/matches`)
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

  updateMatch(payload: any) {
    return this.firestore.collection(`/matches`).doc(payload.id).set(payload, {merge: true});
  }

  updatePlayer(payload: any) {
    return this.firestore.collection(`/users`).doc(payload.id).set(payload, {merge: true});
  }

  updateTeam(payload: any) {
    this.setUserId();
    return this.firestore.collection(`${this.api}/teams`).doc(payload.id).set(payload, {merge: true});
  }

  async getPlayer(playerId: any) {
    let response;
      const res = await firstValueFrom(this.firestore.collection(`/users`).doc(playerId).snapshotChanges()
      .pipe(
        map(async (doc: any) => {
          if (doc.payload.exists) {
            const data = doc.payload.data();
            const id = doc.payload.id;
            response = await { id, ...data }
            return await { id, ...data };
          } else {
            response = null
            return null;
          }
        })
      ));
      return response;
    }

  async deleteMatch(matchId: string) {
    return await this.firestore.collection(`/matches`).doc(matchId).delete();
  }

  async deleteTeam(teamId: string) {
    this.setUserId();
    const response = await this.firestore.collection(`${this.api}/teams`).doc(teamId).delete();
    return response;
  }
  
  setUserId() {
    const userId = localStorage.getItem('userId');
    this.api = `users/${userId}`
  }






    // Method to create a league with a unique ID
    createLeague(leagueData: any, customId: string): Promise<void> {
      // Using custom ID for the document
      return this.firestore.collection('leagues').doc(customId).set(leagueData);
    }

    async getLeagues() {
      try {
        const res = await firstValueFrom(
          this.firestore
            .collection('leagues')
            .snapshotChanges()
            .pipe(
              map((actions) => {
                return actions.map((a) => {
                  const data = a.payload.doc.data() as Record<string, any>;
                  const id = a.payload.doc.id;
                  return { ...data, id };
                });
              })
            )
        );
        return res;
      } catch (error) {
        console.error('Error fetching leagues:', error);
        throw error; // Rethrow the error or handle it as needed
      }
    }

      // Method to get details of a single league by its ID
  async getLeagueDetails(leagueId: string) {
    try {
      const docRef = this.firestore.collection('leagues').doc(leagueId);
      const docSnapshot = await firstValueFrom(docRef.get());

      if (docSnapshot.exists) {
        const data = docSnapshot.data();
        const id = docSnapshot.id;
        if (typeof data === 'object' && data !== null) {
          return { ...data, id };  // Returning league details along with its ID
        } else {
          throw new Error('Data is not an object');
        }
      } else {
        throw new Error('League not found');
      }
    } catch (error) {
      console.error('Error fetching league details:', error);
      throw error; // Handle the error accordingly
    }
  }

  async saveFixturesToFirebase(fixtures: any[]) {
    const fixturesCollection = this.firestore.collection('fixtures');
    for (const fixture of fixtures) {
      await fixturesCollection.add(fixture);
    }
  }
}