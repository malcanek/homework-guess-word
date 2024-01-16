export default class ClientMatch {
  private _onGiveUp?: () => void;

  constructor(onGiveUp?: () => void) {
    this._onGiveUp = onGiveUp;
  }

  giveUp() {
    if(this._onGiveUp) this._onGiveUp();
  }
}