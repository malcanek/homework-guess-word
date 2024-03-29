import { existsSync, readFileSync } from "fs";
import Server from "./Server";
import { join } from "path";

const PORT = 8888;
const UNIX_SOCKET = join(__dirname, '../../game-socket');

const options = {
  key: readFileSync('cert/private-key.pem'),
  cert: readFileSync('cert/public-cert.pem'),
  passphrase: 'challengepasswd',
  rejectUnauthorized: false
};

const server = new Server(options);
server.start(PORT, UNIX_SOCKET);