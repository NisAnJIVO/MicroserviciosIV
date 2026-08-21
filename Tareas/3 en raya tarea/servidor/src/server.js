const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Función para comprobar si hay un ganador o empate
function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    if (board.every(cell => cell !== '')) {
        return 'Empate';
    }

    return null;
}

wss.on('connection', (ws) => {
    console.log('Cliente conectado al juego 3 en raya');

    // Estado del juego individual para cada cliente
    let board = Array(9).fill('');
    let gameOver = false;

    function sendState(message, winner = null) {
        ws.send(JSON.stringify({ board, message, gameOver, winner }));
    }

    sendState("Tu turno: coloca una X en el tablero.");

    ws.on('message', (message) => {
        const input = message.toString().trim();


        if (input === 'reset') {
            board = Array(9).fill('');
            gameOver = false;
            sendState("Juego reiniciado. Tu turno: coloca una X.", null);
            return;
        }

        if (gameOver) {
            sendState("El juego termino. Presiona Reiniciar Juego para volver a jugar.", null);
            return;
        }

        const index = parseInt(input);

        if (isNaN(index) || index < 0 || index > 8 || board[index] !== '') {
            sendState("Casilla no valida o ya ocupada. Elige otra.", null);
            return;
        }

        // Jugador X
        board[index] = 'X';
        let winner = checkWinner(board);

        if (winner === 'X') {
            gameOver = true;
            sendState("Ganaste la partida.", 'X');
            return;
        } else if (winner === 'Empate') {
            gameOver = true;
            sendState("Empate. Ninguno gano.", 'Empate');
            return;
        }

        // Server O al azar
        const emptyIndices = board
            .map((val, idx) => (val === '' ? idx : null))
            .filter(idx => idx !== null);

        if (emptyIndices.length > 0) {
            const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            board[randomIndex] = 'O';

            winner = checkWinner(board);

            if (winner === 'O') {
                gameOver = true;
                sendState("El servidor ha ganado con O. Perdiste.", 'O');
                return;
            } else if (winner === 'Empate') {
                gameOver = true;
                sendState("Empate. Ninguno gano.", 'Empate');
                return;
            }
        }

        sendState("Tu turno: coloca una X.", null);
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

console.log("Servidor WebSocket 3 en Raya escuchando en ws://localhost:8080");
