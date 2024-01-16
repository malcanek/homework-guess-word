import { TLSSocket, TlsOptions, Server as TlsServer, createServer } from "tls";
import { createServer as createHttpServer } from 'http';
import SocketManager from "./SocketManager";
import { readFileSync } from "fs";
import { join } from "path";

export default class Server {
  private _options: TlsOptions;
  private _socketManager: SocketManager = new SocketManager();
  private _port: number;
  private _tlsServer: TlsServer;

  constructor(options: TlsOptions) {
    this._options = options;
    this._tlsServer = createServer(this._options, (socket: TLSSocket) => {
      this._socketManager.add(socket);
    });
    this.attachErrorHandler();
  }

  start(port: number) {
    this._port = port;
    this._tlsServer.listen(port, () => {
      console.log(`Server is listening on ${port}`);
    });
    this.startStatsWeb();
  }

  private attachErrorHandler() {
    this._tlsServer.on('error', (e) => {
      console.log('server error')
      if (e.code === 'ECONNRESET') {
        console.error('Connection reset, restarting server');
      } else {
        console.log(e);
      }
    
      setTimeout(() => {
        this._tlsServer.close();
        this._tlsServer.listen(this._port, () => {
          console.log(`Server is listening on ${this._port}`);
        });
      }, 1000);
    });
  }

  private startStatsWeb() {
    createHttpServer((req, res) => {
      res.write(this.buildStatsWeb());
      res.end();
    }).listen(8080, () => {
      console.log('You can see match info on http://127.0.0.1:8080');
    });
  }

  private buildStatsWeb(): string {
    let html = readFileSync(join(__dirname, 'StatsWebsite.html')).toString('utf8');
    const stats = this._socketManager.stats;
    html = html.replace('{clients}', stats.clients.toString()).replace('{matches}', stats.matches.toString());
    let matchesHtml = '';
    for(let match of stats.matchStats) {
      matchesHtml += `
      <tr>
        <td>${match.guid}</td>
        <td>${match.tries}</td>
        <td>${match.word}</td>
        <td>${match.status}</td>
      </tr>`;
    }
    html = html.replace('{matches}', matchesHtml);
    return html;
  }
}