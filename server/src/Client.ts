import { randomUUID } from "crypto";
import { TLSSocket } from "tls";
import Message from "./Message";
import { INIT_CONN } from "./Commands";

interface OnReceiveListener {
  (message: Message): void;
}

export default class Client {
  guid: string;
  match?: string;
  
  private _socket: TLSSocket;
  private _onReceiveListeners: OnReceiveListener[] = [];

  constructor(socket: TLSSocket) {
    this._socket = socket;
    this.guid = randomUUID();
    this.receive();
  }

  initiateServer() {
    this.send(new Message(INIT_CONN));
  }

  send(message: Message) {
    this._socket.write(message.serialize());
  }

  destroy() {
    this._socket.destroy();
  }

  addReceiveListener(listener: OnReceiveListener): void {
    this._onReceiveListeners.push(listener);
  }

  private receive() {
    this._socket.on('data', data => {
      const message = new Message();
      message.deserialize(data);
      for(let listener of this._onReceiveListeners) {
        listener(message);
      }
    });
  }
}