import { TLSSocket } from "tls";
import Client from "./Client";
import Message from "./Message";
import Match from "./Match";
import { ACCEPT_MATCH, AVAILABLE_OPPONENTS, DECLINE_MATCH, END_MATCH, ERROR, GET_OPPONENTS, GIVE_UP, GUESS, HINT, LOGIN, LOGIN_FAILED, LOGIN_SUCCESSFUL, MATCH_STARTED, MESSAGE, START_MATCH, WRONG_GUESS } from "./Commands";

export default class SocketManager {
  private _clients: Record<string, Client> = {};
  private _matches: Record<string, Match> = {};

  get stats() {
    let matches = 0;
    const matchStats: {guid: string, tries: number, word: string, status: string}[] = [];
    for(let match of Object.values(this._matches)) {
      if(['Started', 'Accepted'].includes(match.status)) {
        matches++;
      }
      matchStats.push({
        guid: match.guid,
        tries: match.tries,
        word: match.word,
        status: match.status
      });
    }
    return {
      clients: Object.keys(this._clients).length,
      matches,
      matchStats
    }
  }

  add(socket: TLSSocket) {
    const client = new Client(socket);
    this._clients[client.guid] = client;
    socket.on('error', () => {
      this.destroySocket(client);
    });
    socket.on('end', () => {
      this.destroySocket(client);
    });
    client.initiateServer();
    client.addReceiveListener((message: Message) => this.processClientMessage(message,  client));
    console.log(`Client connected. Number of clients: ${Object.keys(this._clients).length}`);
  }

  getAvailableClientIds(exclude?: string): string[] {
    return Object.values(this._clients).filter(val => !val.match && val.guid !== exclude).map(val => val.guid);
  }

  getClient(guid: string): Client | undefined {
    return this._clients[guid];
  }

  destroySocket(client: Client): void {
    client.destroy();
    delete this._clients[client.guid];
    console.log(`Client disconnected. Number of clients: ${Object.keys(this._clients).length}`);
  }

  processClientMessage(message: Message, client: Client) {
    if(client.match && [LOGIN, GET_OPPONENTS, START_MATCH].includes(message.command)) {
      client.send(new Message('ERROR', 'Cannot use this command when match is started.'));
      return;
    }

    let match: Match;
    switch(message.command) {
      case LOGIN:
        if(message.messageString === 'passwd') {
          client.send(new Message(LOGIN_SUCCESSFUL));
        } else {
          client.send(new Message(LOGIN_FAILED));
          this.destroySocket(client);
        }
        break;
      
      case GET_OPPONENTS:
        const opponents = this.getAvailableClientIds(client.guid);
        if(opponents.length === 0) {
          client.send(new Message('MESSAGE', 'No available opponents :( Please try it later!'));
          break;
        }
        client.send(new Message(AVAILABLE_OPPONENTS, JSON.stringify(opponents)));
        break;

      case START_MATCH:
        const [opponentGuid, word] = message.messageString.split(' ');
        const opponent = this._clients[opponentGuid];
        if(!opponent || opponent.match) {
          client.send(new Message(ERROR, 'Opponent is not available for a game.'));
          const opponents = this.getAvailableClientIds(client.guid);
          if(opponents.length === 0) {
            client.send(new Message('MESSAGE', 'No available opponents :( Please try it later!'));
            break;
          }
          client.send(new Message(AVAILABLE_OPPONENTS, JSON.stringify(opponents)));
          break;
        }
        match = new Match(client, opponent, word);
        this._matches[match.guid] = match;
        client.match = match.guid;
        opponent.match = match.guid;
        opponent.send(new Message(ACCEPT_MATCH, client.guid));
        break;

      case ACCEPT_MATCH:
        match = this._matches[client.match];
        match.accepted = true;
        match.opponent.send(new Message(MESSAGE, 'Guess the word!'));
        match.initiator.send(new Message(MATCH_STARTED));
        match.status = 'Accepted';
        break;

      case DECLINE_MATCH:
        match = this._matches[client.match];
        match.initiator.send(new Message(END_MATCH, 'Opponent did not accept the match!'));
        match.status = 'Declined';
        this.cancelMatch(match);
        break;

      case GIVE_UP:
        match = this._matches[client.match];
        match.initiator.send(new Message(END_MATCH, 'Opponent gave up!'));
        match.status = 'Gave Up';
        this.cancelMatch(match);
        break;

      case GUESS:
        match = this._matches[client.match];
        match.tries++;
        if(match.verifyWord(message.messageString)) {
          match.opponent.send(new Message(END_MATCH, `You have guessed the word! It really is ${message.messageString}. It took you ${match.tries} attempts to guess the word.`));
          match.initiator.send(new Message(END_MATCH, `Your opponent just guessed the word! It took ${match.tries} attempts`));
          match.end();
        } else {
          match.opponent.send(new Message(WRONG_GUESS, 'Wrong word. Please try again'));
          match.initiator.send(new Message(MESSAGE, `Opponent has guess "${message.messageString}" which was wrong. Number of attempts: ${match.tries}.`));
        }
        break;

      case HINT:
        match = this._matches[client.match];
        match.opponent.send(new Message('MESSAGE', 'Hint: ' + message.messageString));
        break;
      
      default:
        client.send(new Message(ERROR, 'Unknown command'));
        break;
    };
  }

  cancelMatch(match: Match): void {
    match.end();
    // delete this._matches[match.guid];
  }
}