import tls, { ConnectionOptions, TLSSocket } from "tls";
import Client from "../../server/src/Client";
import Prompter from "./Prompter";

export default class GameClient {
  private _socket: TLSSocket;
  private _client: Client;
  private _port: number | string;
  private _server: string = '127.0.0.1';
  private _options: ConnectionOptions;

  constructor(port: number | string, server = '127.0.0.1') {
    this._port = port;
    this._server = server;
  }

  connect(options: ConnectionOptions) {
    this._options = options;
    if(typeof this._port === 'string') {
      this._socket = tls.connect({path: this._port, ...this._options}, () => {
        this._client = new Client(this._socket);
        const prompter = new Prompter(this._client);
        prompter.start();
      });
    } else {
      this._socket = tls.connect(this._port, this._server, this._options, () => {
        this._client = new Client(this._socket);
        const prompter = new Prompter(this._client);
        prompter.start();
      });
    }
    this._socket.on('error', e => this.errorHandler(e));
    this._socket.on('close', () => {
      this.destroy();
    });
  }

  errorHandler(e) {
    if(e.code === 'ECONNREFUSED') {
      console.log('Server is not running!');
    }
  }

  destroy() {
    if(this._client) {
      this._client.destroy();
    }
    this._socket.end();
    this._socket.destroy();
    process.exit(0);
  }
}