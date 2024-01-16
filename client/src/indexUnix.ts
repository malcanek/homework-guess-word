import { readFileSync } from "fs";
import GameClient from "./GameClient";

const UNIX_SOCKET = '/var/run/game-socket';

const options = {
  cert: readFileSync('cert/public-cert.pem'),
  rejectUnauthorized: false
};

const gameClient = new GameClient(UNIX_SOCKET);
gameClient.connect(options);

const cleanup = () => {
  gameClient.destroy();
};

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGUSR1', cleanup);
process.on('SIGUSR2', cleanup);
process.on('uncaughtException', cleanup);