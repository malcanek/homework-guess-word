import { randomUUID } from "crypto";
import Client from "./Client";

export default class Match {
  guid: string;
  accepted: boolean = false;
  tries: number = 0;
  status: string = 'Started';

  private _initiator: Client;
  private _opponent: Client;
  private _word: string;

  constructor(initiator: Client, opponent: Client, word: string) {
    this._initiator = initiator;
    this._opponent = opponent;
    this._word = word;
    this.guid = randomUUID();
  }

  get opponent() {
    return this._opponent;
  }

  get initiator() {
    return this._initiator;
  }

  get word(): string {
    return this._word;
  }

  verifyWord(word: string) {
    //Make the guess case insensitive
    const done = word.toLowerCase() === this._word.toLowerCase();
    if(done) {
      this.status = 'Guessed';
    }
    return done;
  }

  end() {
    this._initiator.match = null;
    this._opponent.match = null;
  }
}