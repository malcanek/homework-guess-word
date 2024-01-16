import { GET_OPPONENTS, MESSAGE, START_MATCH } from "./Commands";

const commandTree = {
  get: {
    opponents: GET_OPPONENTS
  },
  start: {
    match: START_MATCH
  }
}

export function stringToCommand(msg: string): {command: string, data: string} {
  const parsed = msg.trim().split(' ');
  let command = commandTree;
  do {
    const commandStr = parsed.shift().trim();
    command = command[commandStr];
    if(!command) return {
      command: MESSAGE,
      data: msg,
    };
  } while(typeof command !== 'string');

  return {command: command as any, data: parsed.join(' ').trim()};
}