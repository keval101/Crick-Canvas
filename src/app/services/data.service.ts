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




  // Fetch details of multiple teams concurrently using Promise.all
  async getUserTeams(uids: string[]): Promise<any[]> {
    try {
      // Use Promise.all to fetch user data concurrently for all uids
      const userPromises = uids.map(async (uid) => {
        const res = await firstValueFrom(
          this.firestore.collection(`/users`).doc(uid).snapshotChanges().pipe(
            map((doc: any) => {
              if (doc.payload.exists) {
                const data = doc.payload.data();
                const id = doc.payload.id;
                const object = {
                  name: data.name,
                  team: data.team,
                  uid: data.uid,
                  id: id
                }
                return { ...object };
              } else {
                return null;
              }
            })
          )
        );
        return res;
      });

      // Wait for all the promises to resolve and return the result
      const results = await Promise.all(userPromises);
      return results;

    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }
  }

  getAllusers() {
    return this.firestore.collection(`/users`).valueChanges();
  }

  // Method to create a league with a unique ID
  createLeague(leagueData: any, customId: string): Promise<void> {
    // Using custom ID for the document
    return this.firestore.collection('leagues').doc(customId).set(leagueData);
  }

  // Get leagues collection
  getLeagues(): Observable<any[]> {
    return this.firestore
      .collection('leagues')
      .snapshotChanges()
      .pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data() as Record<string, any>;
            const id = a.payload.doc.id;
            return { ...data, id };
          });
        })
      );
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
  async getLeague(leagueCode: string) {
    try {
      const docRef = this.firestore.collection('leagues', ref => ref.where('leagueCode', '==', leagueCode).limit(1));
      const docSnapshots  = await firstValueFrom(docRef.get());

      if (!docSnapshots .empty) {
        const docSnapshot = docSnapshots.docs[0];
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

  async saveH2HToFirebase(fixture) {
    return this.firestore.collection('matches').doc(fixture.id).set(fixture);
  }

  async deleteLeague(leagueId: string) {
    await this.firestore.collection('leagues').doc(leagueId).delete();
  }

  updateUserDetail(payload: any, userId: string) {
    return this.firestore.collection('users').doc(userId).set(payload, {merge: true});
  }

  joinLeague(payload: any, leagueId: string) {
    return this.firestore.collection('leagues').doc(leagueId).set(payload, {merge: true});
  }

  saveMatches(matches: any[]): Promise<void> {
    console.log(matches)
    // Assuming you want to save to a 'league-matches' collection
    const collectionRef = this.firestore.collection('league-matches');
    
    // Create a batch to save all matches in one atomic operation
    const batch = this.firestore.firestore.batch();
    
    matches.forEach(match => {
      // Use league_id and match_number as a composite key, or generate a new ID
      const docRef = collectionRef.doc(match?.id ? match?.id : `${match.league_id}_${match.match_number}`).ref;
      batch.set(docRef, match);
    });

    // Commit the batch (single API call)
    return batch.commit();
  }

  getLeagueMatches(leagueId: string) {
    return this.firestore.collection('league-matches', ref => ref.where('league_id', '==', leagueId).limit(100))
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

  
  updateMatchResult(payload: any, fixtureId: string) {
    return this.firestore.collection('league-matches').doc(fixtureId).set(payload, {merge: true});
  }

  updateH2HResult(payload: any, fixtureId: string) {
    return this.firestore.collection('matches').doc(fixtureId).set(payload, {merge: true});
  }

  getAllLeagueMatches() {
    return this.firestore.collection('league-matches').valueChanges();
  }

  getUserMatches(userId: string) {
    return this.firestore.collection(`/matches`, ref => ref.where('team_one.id', '==', userId).limit(100))
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

  // Get league-matches where playerId is in either team_one.id or team_two.id
  async getPlayerMatches(playerId: string) {
    const teamOneQuery = this.firestore.collection('league-matches', ref => 
      ref.where('team_one.id', '==', playerId)
    ).get().toPromise();;

    const teamTwoQuery = this.firestore.collection('league-matches', ref => 
      ref.where('team_two.id', '==', playerId)
    ).get().toPromise();;

    const [teamOneSnapshot, teamTwoSnapshot] = await Promise.all([teamOneQuery, teamTwoQuery]);

    const teamOneMatches = teamOneSnapshot.docs.map(doc => doc.data());
    const teamTwoMatches = teamTwoSnapshot.docs.map(doc => doc.data());

    // Optional: remove duplicates if needed
    const allMatches = [...teamOneMatches, ...teamTwoMatches];

    return allMatches;
  }

    // Get league-matches where playerId is in either team_one.id or team_two.id
    async getPlayerH2HMatches(playerId: string) {
      const teamOneQuery = this.firestore.collection('matches', ref => 
        ref.where('team_one.id', '==', playerId)
      ).get().toPromise();;
  
      const teamTwoQuery = this.firestore.collection('matches', ref => 
        ref.where('team_two.id', '==', playerId)
      ).get().toPromise();;
  
      const [teamOneSnapshot, teamTwoSnapshot] = await Promise.all([teamOneQuery, teamTwoQuery]);
  
      const teamOneMatches = teamOneSnapshot.docs.map(doc => doc.data());
      const teamTwoMatches = teamTwoSnapshot.docs.map(doc => doc.data());
  
      // Optional: remove duplicates if needed
      const allMatches = [...teamOneMatches, ...teamTwoMatches];
  
      return allMatches;
    }

  deleteLeagueMatches(leagueId: string) {
    // Delete all matches first
    this.firestore.collection('league-matches', ref => ref.where('league_id', '==', leagueId))
      .get()
      .subscribe(snapshot => {
        const batch = this.firestore.firestore.batch();
  
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
  
        batch.commit().then(() => {
          // After deleting all matches, delete the league
          this.firestore.collection('leagues').doc(leagueId).delete()
            .then(() => {
              console.log('League and all its matches deleted successfully!');
            })
            .catch(err => console.error('Error deleting league:', err));
        }).catch(err => console.error('Error deleting matches:', err));
      });
  }

}