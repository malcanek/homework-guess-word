import readline, { Interface, Key } from "readline";
import Client from "../../server/src/Client";
import Message from "../../server/src/Message";
import ClientMatch from "./ClientMatch";
import {
  ACCEPT_MATCH,
  DECLINE_MATCH,
  ERROR,
  INIT_CONN,
  LOGIN,
  LOGIN_FAILED,
  LOGIN_SUCCESSFUL,
  WRONG_GUESS, END_MATCH,
  GIVE_UP,
  AVAILABLE_OPPONENTS,
  MATCH_STARTED,
  HINT,
  START_MATCH,
  GUESS
} from "../../server/src/Commands";

export default class Prompter {
  private _aborter: AbortController = new AbortController();
  private _rl: Interface;
  private _match?: ClientMatch | null = null;
  private _opponents: string[] = [];
  private _client: Client;
  private _muted: boolean = false;

  constructor(client: Client) {
    readline.emitKeypressEvents(process.stdin);

    this._rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    this.fixStdoutFor(this._rl);
    this.attachListener();
    this._client = client;
    // this._client.addReceiveListener(this.handleMessage);
  }

  get match() {
    return this._match;
  }

  asyncCmdQuestion(question: string): Promise<string> {
    this._aborter = new AbortController();
    return new Promise((resolve) => {
      this._rl.question(question + '> ', {signal: this._aborter.signal}, msg => {
        resolve(msg);
      });
    });
  }
  
  async command(message = 'command') {
    const cmd = await this.asyncCmdQuestion(message);
    try {
      if(this._match) {
        const message = new Message(HINT, cmd);
        this._client.send(message);
      } else {
        const message = new Message().from(cmd);
        if(message.command === START_MATCH) {
          const messageSplit = message.messageString.split(' ');
          if(this._opponents[messageSplit[0]]) {
            messageSplit[0] = this._opponents[messageSplit[0]];
            message.message = Buffer.from(messageSplit.join(' '));
          }
        }
        this._client.send(message);
      }
    } catch(err) {
      console.log(err.message);
    } finally {
      await this.command(message);
    }
  }
  
  async guessPrompt() {
    const cmd = await this.asyncCmdQuestion('Guess the word');
    this._client.send(new Message(GUESS, cmd));
  }

  setOpponents(opponents: string[]) {
    this._opponents = opponents;
  }

  setMatch(match: ClientMatch | null) {
    this._match = match;
  }

  abort() {
    this._aborter.abort();
  }

  start() {
    this._client.addReceiveListener(message => this.handleMessage(message));
  }

  private attachListener() {
    process.stdin.on('keypress', (chunk, key: Key) => {
      if(this._muted) {
        //@ts-ignore
        readline.moveCursor(this._rl.output, -1, 0);
        //@ts-ignore
        readline.clearLine(this._rl.output, 1);
      }
      if(key.ctrl && key.name === 'x') {
        if(this._match) {
          this._match.giveUp();
        }
      }
      if(key.ctrl && key.name === 'c') {
        this._client.destroy();
        process.exit();
      }
    });
  }

  private fixStdoutFor(cls) {
    var oldStdout = process.stdout;
    var newStdout = Object.create(oldStdout);
    newStdout.write = function() {
        cls.output.write('\x1b[2K\r');
        var result = oldStdout.write.apply(
            this,
            Array.prototype.slice.call(arguments)
        );
        cls._refreshLine();
        return result;
    }
    Object.defineProperty(process, 'stdout', {
      get:  function() { return newStdout; }
    });
  }

  private async handleMessage(message) {
    switch(message.command) {
      case INIT_CONN:
        this._muted = true;
        const pass = await this.asyncCmdQuestion('type in your password');
        this._muted = false;
        this._client.send(new Message(LOGIN, pass));
        break;
      
      case LOGIN_SUCCESSFUL:
        console.log('You were successfully logged in!');
        console.log(`
        Available commands:
          - get opponents
          - start match <opponent_id | opponent_index> <word_to_guess>
        `);
        console.log('Opponent can be selected either by ID or by index (in parentheses).')
        console.log('If you are the one who started the match, every input you type will be send as a hint to the opponent.');
        console.log('If you want to give up already started match press ctrl + X');
        this.command();
        break;

      case LOGIN_FAILED:
        console.log('Your have typed in wrong password!');
        this.abort();
        break;

      case AVAILABLE_OPPONENTS:
        const opponents = JSON.parse(message.messageString);
        const opponentsAdjusted = opponents.map((val, index) => val + ` (${index})`);
        this.setOpponents(opponents);
        console.log(`You can select one of these opponents: ${opponentsAdjusted.join(', ')}`);
        break;

      case ACCEPT_MATCH:
        this.abort();
        const accept = await this.asyncCmdQuestion('Do you want to accept match (y/N)?');
        if(accept.toLowerCase() === 'y') {
          this.setMatch(new ClientMatch(() => {
            this._client.send(new Message(GIVE_UP));
            this.setMatch(null);
            this.abort();
            this.command();
          }));
          this._client.send(new Message(ACCEPT_MATCH));
          this.guessPrompt();
        } else {
          this._client.send(new Message(DECLINE_MATCH));
          this.command();
        }
        break;

      case MATCH_STARTED:
        this.setMatch(new ClientMatch());
        this.abort();
        this.command('hint');
        break;

      case WRONG_GUESS:
        console.log('That is not the right word. Try again.');
        this.guessPrompt();
        break;

      case END_MATCH:
        console.log(message.messageString || 'Match has ended.');
        this.setMatch(null);
        this.command();
        break;

      case ERROR:
        console.log('An error occurred: ' + message.messageString);
        break;

      default:
        console.log(message.messageString);
        break;
    }
  }
}