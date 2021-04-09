        // получаем доступ к основному холсту и холсту с игровой статистикой
        const canvas = document.getElementById('game');
        const context = canvas.getContext('2d');
        const canvasScore = document.getElementById('score');
        const contextScore = canvasScore.getContext('2d');
        // размер квадратика и массив с последовательностями фигур, на старте — пустой
        const grid = 32;
        var tetrominoSequence = [];
        // с помощью двумерного массива следим за тем, что находится в каждой клетке игрового поля
        // размер поля — 10 на 20, и несколько строк ещё находится за видимой областью
        var playfield = [];

        // заполняем сразу массив пустыми ячейками
        for (let row = -2; row < 20; row++) {
            playfield[row] = [];

            for (let col = 0; col < 10; col++) {
                playfield[row][col] = 0;
            }
        }

        const tetrominos = {
            'I': [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            'J': [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0],
            ],
            'L': [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0],
            ],
            'O': [
                [1, 1],
                [1, 1],
            ],
            'S': [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0],
            ],
            'Z': [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0],
            ],
            'T': [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0],
            ]
        };

        const colors = {
            'I': 'SpringGreen',
            'O': 'Khaki',
            'T': 'MediumPurple',
            'S': 'LightSeaGreen',
            'Z': 'Crimson',
            'J': 'DodgerBlue',
            'L': 'LightSalmon'
        };

        // счётчик и текущая фигура в игре
        let count = 0;
        let tetromino = getNextFigure();
        // следим за кадрами анимации, чтобы если что — остановить игру
        let rAF = null;
        // флаг конца игры, на старте — неактивный
        let gameOver = false;

        let score = 0;
        let record = 0;
        let level = 1;
        let recordName = '';

        name = prompt("Ваше имя", "");


        // Узнаём размер хранилища Если в хранилище уже что-то есть то достаём оттуда значение рекорда и имя чемпиона
        var Storage_size = localStorage.length;
        if (Storage_size > 0) {
            record = localStorage.record;
            recordName = localStorage.recordName;
        }

        // Функция возвращает случайное число в заданном диапазоне
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // создаём последовательность фигур, которая появится в игре
        function generateSequence() {
            const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

            while (sequence.length) {
                // случайным образом находим любую из них & помещаем выбранную фигуру в игровой массив с последовательностями
                const rand = getRandomInt(0, sequence.length - 1);
                const name = sequence.splice(rand, 1)[0];
                tetrominoSequence.push(name);
            }
        }

        
        function getNextFigure() {
            if (tetrominoSequence.length === 0) {
                generateSequence();
            }
            // берём первую фигуру из массива & создаём матрицу, с которой мы отрисуем фигуру
            const name = tetrominoSequence.pop();
            const matrix = tetrominos[name];

            // I и O стартуют с середины, остальные — чуть левее
            const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

            // I начинает с 21 строки (смещение -1), а все остальные — со строки 22 (смещение -2)
            const row = name === 'I' ? -1 : -2;

            return {
                name: name, 
                matrix: matrix, // матрица с фигурой
                row: row, // текущая строка (фигуры стартуют за видимой областью холста)
                col: col // текущий столбец
            };
        }

        // поворачиваем матрицу на 90 градусов
        function rotate(matrix) {
            const N = matrix.length - 1;
            const result = matrix.map((row, i) =>
                row.map((val, j) => matrix[N - j][i])
            );
            return result;
        }

        // проверяем после появления или вращения, может ли матрица (фигура) быть в этом месте поля или она вылезет за его границы
        function isValidMove(matrix, cellRow, cellCol) {
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    if (matrix[row][col] && (
                            cellCol + col < 0 ||
                            cellCol + col >= playfield[0].length ||
                            cellRow + row >= playfield.length ||
                            playfield[cellRow + row][cellCol + col])) {
                        return false;
                    }
                }
            }
            return true;
        }

        function placeTetromino() {
            for (let row = 0; row < tetromino.matrix.length; row++) {
                for (let col = 0; col < tetromino.matrix[row].length; col++) {
                    if (tetromino.matrix[row][col]) {
                        // если край фигуры после установки вылезает за границы поля, то игра закончилась
                        if (tetromino.row + row < 0) {
                            return showGameOver();
                        }
                        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
                    }
                }
            }

            for (let row = playfield.length - 1; row >= 0;) {
                // если ряд заполнен
                if (playfield[row].every(cell => !!cell)) {

                    score += 10;
                    level = Math.floor(score / 100) + 1;
                    if (score > record) {
                        record = score;
                        localStorage.record = record;
                        recordName = name;
                        localStorage.recordName = recordName;
                    }
                    for (let r = row; r >= 0; r--) {
                        for (let c = 0; c < playfield[r].length; c++) {
                            playfield[r][c] = playfield[r - 1][c];
                        }
                    }
                } else {
                    row--;
                }
            }
            tetromino = getNextFigure();
        }

        function showGameOver() {
            cancelAnimationFrame(rAF);
            gameOver = true;
            context.fillStyle = 'black';
            context.globalAlpha = 0.75;
            context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
            context.globalAlpha = 1;
            context.fillStyle = 'white';
            context.font = '36px monospace';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
        }

        function showScore() {
            contextScore.clearRect(0, 0, canvasScore.width, canvasScore.height);
            contextScore.globalAlpha = 1;
            contextScore.fillStyle = 'white';
            contextScore.font = '18px Courier New';
            contextScore.fillText('Уровень: ' + level, 15, 20);
            contextScore.fillText('Очков:   ' + score, 15, 50);
            contextScore.fillText('Чемпион: ' + recordName, 160, 20);
            contextScore.fillText('Рекорд:  ' + record, 160, 50);

        }

        // главный цикл игры (начинаем анимацию, очищаем холст)
        function loop() {
            rAF = requestAnimationFrame(loop);
            context.clearRect(0, 0, canvas.width, canvas.height);

            // рисуем игровое поле с учётом заполненных фигур
            for (let row = 0; row < 20; row++) {
                for (let col = 0; col < 10; col++) {
                    if (playfield[row][col]) {
                        const name = playfield[row][col];
                        context.fillStyle = colors[name];

                        // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
                        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
                    }
                }
            }

            showScore();

            if (tetromino) {
                if (++count > (36 - level)) {
                    tetromino.row++;
                    count = 0;
                    // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
                    if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                        tetromino.row--;
                        placeTetromino();
                    }
                }
                context.fillStyle = colors[tetromino.name];

                // отрисовываем её
                for (let row = 0; row < tetromino.matrix.length; row++) {
                    for (let col = 0; col < tetromino.matrix[row].length; col++) {
                        if (tetromino.matrix[row][col]) {
                            context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid - 1, grid - 1);
                        }
                    }
                }
            }
        }

        document.addEventListener('keydown', function(e) {
            if (gameOver) return;

            if (e.which === 37 || e.which === 39) {
                const col = e.which === 37
                    ?
                    tetromino.col - 1 :
                    tetromino.col + 1;
                if (isValidMove(tetromino.matrix, tetromino.row, col)) {
                    tetromino.col = col;
                }
            }

            // стрелка вверх — поворот
            if (e.which === 38) {
                const matrix = rotate(tetromino.matrix);
                if (isValidMove(matrix, tetromino.row, tetromino.col)) {
                    tetromino.matrix = matrix;
                }
            }

            // стрелка вниз — ускорить падение
            if (e.which === 40) {
                const row = tetromino.row + 1;
                if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
                    tetromino.row = row - 1;
                    placeTetromino();
                    return;
                }
                // запоминаем строку, куда стала фигура
                tetromino.row = row;
            }
        });
        rAF = requestAnimationFrame(loop);