# Guess a word

## How to setup the game
- Make sure that Node 16 or higher is installed. You can ensure that by typing ```node -v```.
- Git clone the project
- In the project root call ```install.sh``` script
- Now you can start server with ```start-server.sh``` script and start client with ```start-client.sh``` script or ```start-client-unix.sh```. Please note that server has to be started first, clients end with error if server is not started first.
- Stats website is available on http://127.0.0.1:8080

## How to play
When you start the client you will be prompted to enter the password. Password is ```passwd```

If you enter the password correctly you will be logged in and opponent can invite you to play a game or you can list opponents and invite them to play with you.

To get available opponents type ```get opponents``` command.
To start a match type ```start match <opponent_id | opponent_index> <word>```. For easier opponent selection you can use opponent index which is number in the parenthesis. Tutorial on how to use the game is also displayed when you log into the game.