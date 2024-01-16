import { readFileSync } from "fs";
import GameClient from "./GameClient";

const PORT = 8888;

const options = {
  cert: readFileSync('cert/public-cert.pem'),
  rejectUnauthorized: false
};

const gameClient = new GameClient(PORT);
gameClient.connect(options);

const cleanup = () => {
  gameClient.destroy();
};

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGUSR1', cleanup);
process.on('SIGUSR2', cleanup);
process.on('uncaughtException', cleanup);