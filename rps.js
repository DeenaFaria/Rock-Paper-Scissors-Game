const crypto = require('crypto');
const ascii_table = require('ascii-table');

class Rules { //class for defining rules
    constructor(moves) {
        this.moves = moves;
        this.total_move = moves.length;
    }

   getMoveIndex(move) {
        return this.moves.indexOf(move);
    }

    result(usermove, commove) {
        const userin = this.getMoveIndex(usermove);
        const comin = this.getMoveIndex(commove);

        if (userin === comin) {
            return 'Draw';
        }

        const half = Math.floor(this.total_move / 2);
        const diff = (comin - userin + this.total_move) % this.total_move;

        return diff <= half ? 'You lose' : 'You win';
    }
}

class HelpTable { //class for defining the help table
    constructor(moves) {
        this.moves = moves;
    }

    result(i, j) {
        if (i === j) return 'Draw';
        const half = Math.floor(this.moves.length / 2);
        const diff = (j - i + this.moves.length) % this.moves.length;
        return diff <= half ? 'Win' : 'Lose';
    }

    genTable() {
        const table = new ascii_table('Help Table');
        table.setHeading('PC/User', ...this.moves);

        this.moves.forEach((move, i) => {
            const row = [move]; 
            this.moves.forEach((_, j) => {
                row.push(this.result(i, j)); 
            });
            table.addRow(...row);
        });

        console.log(table.toString()); 
    }
}

class HMACGenerator { //HMAC generator class
    constructor() {
        this.key = this.genKey();
    }

    genKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    genHMAC(move) {
        const hmac = crypto.createHmac('sha256', this.key);
        hmac.update(move);
        return hmac.digest('hex');
    }
}

class Game { //game class
    constructor(moves) {
        if (moves.length < 3 || moves.length % 2 === 0 || new Set(moves).size !== moves.length) {
            throw new Error('Invalid input. Moves must be an odd number and greater than or equal to 3.');
        }

        this.moves = moves;
        this.hmacGenerator = new HMACGenerator();
        this.rules = new Rules(moves);
        this.newRound(); 
    }

    newRound() {
        this.commove = this.randomcommove(); 
        this.hmacGenerator.key = this.hmacGenerator.genKey(); 
        this.hmac = this.hmacGenerator.genHMAC(this.commove); 
    }

    randomcommove() {
        const randomIndex = crypto.randomInt(0, this.moves.length);
        return this.moves[randomIndex];
    }

    displayMenu() {
        console.log(`HMAC: ${this.hmac}`);
        console.log('Available moves:');
        this.moves.forEach((move, index) => {
            console.log(`${index + 1} - ${move}`);
        });
        console.log('0 - exit');
        console.log('? - help');
    }

    play(user_input) {
        const usermoveIndex = parseInt(user_input, 10) - 1;

        if (user_input === '0') {
            console.log('Exiting game...');
            process.exit();
        } else if (user_input === '?') {
            const helpTable = new HelpTable(this.moves);
            helpTable.genTable();
        } else if (isNaN(usermoveIndex) || usermoveIndex < 0 || usermoveIndex >= this.moves.length) {
            console.log('Invalid input. Please try again.');
        } else {
            const usermove = this.moves[usermoveIndex];
            console.log(`Your move: ${usermove}`);
            console.log(`Computer move: ${this.commove}`);
            const result = this.rules.result(usermove, this.commove);
            console.log(result);
            console.log(`HMAC key: ${this.hmacGenerator.key}`);
            this.newRound();
        }
    }
}

(function main() {
    const args = process.argv.slice(2);
    if (args.length < 3 || args.length % 2 === 0) {
        console.error('Error: You must provide an odd number (≥ 3) of unique moves.');
        console.error('Example: node game.js rock paper scissors');
        process.exit(1);
    }

    try {
        const game = new Game(args);
        game.displayMenu();
        process.stdout.write("Enter your move: ");

        process.stdin.on('data', (input) => {
            game.play(input.toString().trim());
            process.stdout.write("Enter your move: ");
        });
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
})();