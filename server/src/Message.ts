import { deserialize, serialize } from "v8";
import { stringToCommand } from "./CommandHandler";
import { START_MATCH } from "./Commands";

export default class Message {
  private _mime: string = 'text/plain';
  private _data?: Buffer;
  private _command: string;

  constructor(command?: string, message?: string | Buffer, mime?: string) {
    if(message) this._data = Buffer.isBuffer(message) ? message : Buffer.from(message);
    if(mime) this._mime = mime;
    if(command) this._command = command;
  }

  get mime(): string {
    return this._mime;
  }

  set mime(mime: string) {
    this._mime = mime;
  }

  get message(): Buffer {
    return this._data;
  }

  set message(message: string | Buffer) {
    this._data = Buffer.isBuffer(message) ? message : Buffer.from(message);
  }

  get command(): string {
    return this._command;
  }

  set command(cmd: string) {
    this._command = cmd;
  }

  get messageString(): string {
    if(!this._data) return;
    return this.decodeMessage(this._data);
  }

  decodeMessage(buffer: Buffer): string {
    return buffer.toString();
  }
  
  serialize(): Buffer {
    return serialize({mime: this._mime, data: this._data, command: this._command});
  }

  deserialize(buff: Buffer) {
    const data = deserialize(buff);
    if(data.mime) {
      this._mime = data.mime
    }
    if(data.data) {
      this._data = data.data;
    }
    if(data.command) {
      this._command = data.command;
    }
  }

  from(cmd: string) {
    const parsed = stringToCommand(cmd);
    this._command = parsed.command;
    this._data = Buffer.from(parsed.data);
    this.verifyCommand();
    return this;
  }

  private verifyCommand() {
    if(this._command === START_MATCH && this.messageString.split(' ').length !== 2) {
      throw new Error('Command start match expects 2 arguments. Please use `start match <opponent_id> <word_to_match>` format.');
    }
  }
}