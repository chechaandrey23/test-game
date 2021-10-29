import crypto from 'crypto';

import prompts from 'prompts';
import {table} from 'table';

const values = process.argv.slice(2);

if(values < 3) {
	throw new Error('The number of transferred entities for the game must be greater than 3');
}

if(values.length % 2 === 0) {
	throw new Error('The number of transferred entities for the game must be odd');
}

function* genShiftEntries(values) {
	for(let i=0, size=values.length; i<size; i++) {
		yield values.slice(i+1).concat(values.slice(0,i+1));
	}
}

function getEntries(values) {
	let result = {};
	let coef = (values.length-1)/2;
	
	for(let newEntry of genShiftEntries(values)) {
		let entryName = newEntry[0]+'';
		if(result.hasOwnProperty(entryName)) {
			throw new Error('Passed entities must be unique');
		}
		result[entryName] = {win: newEntry.slice(1, coef+1), lose: newEntry.slice(1+coef, 1+coef*2)}
	}
	
	return result;
}

function winProbility(value, entry, prop) {
	const win = entry.win;
	const lose = entry.lose;
	if(value === prop) {
		return 'DRAW';
	} else if(win.includes(value)) {
		return 'WIN';
	} else if(lose.includes(value)) {
		return 'LOSE';
	} else {
		throw new Error('...???!!!?');
	}
}

const generateKey = (a, b) => {
	return new Promise((res, rej) => {
		crypto.generateKey(a, b, (err, key) => {
			if(err) rej(err);
			res(key.export().toString('hex'))  // 46e..........620
		});
	});
}

(async function main(values) {
	const entries = getEntries(values);
	
	while(true) {
		let moveComp = crypto.randomInt(1, values.length + 1);
		let key = await generateKey('hmac', { length: 128 });
		
		const hmac = crypto.createHmac('sha256', key);
		hmac.update(moveComp+'');
		console.log(`HMAC: ${hmac.digest('hex')}`);
		
		console.log('Available moves:');
		values.map((value, index) => {
			console.log(`${index+1} - ${value}`);
		});
		console.log(`0 - exit`);
		console.log(`? - help`);
		
		let response = await prompts({
			type: 'text',
			name: 'move',
			message: 'Enter your move:',
			validate: (value) => {
				let newvalue = value*1;
				if(value && ((newvalue >= 1 && newvalue <= values.length) || value == 0 || value === '?')) {
					return true;
				} else {
					return 'Incorrect MOVE!!!';
				}
			}
		});
		
		if(response.move == 0) {
			break;
		} else if(response.move == '?') {
			let data = [
				['user/II', ...values],
				...values.map((prop) => {
					//const win = entries[prop].win;
					//const lose = entries[prop].lose;
					return [prop, ...values.map((value) => {
						return winProbility(value, entries[prop], prop);
					})]
				})
			];
			
			console.log('Help Table:');
			console.log(table(data));
		} else {
			let move = response.move*1;
			let moveName = values[move - 1];
			let moveCompName = values[moveComp - 1];
			console.log(`Your move: ${moveName}`);
			console.log(`Computer move: ${moveCompName}`);
			console.log(`You ${winProbility(moveCompName, entries[moveName], moveName)}!`);
			console.log(`Secret 128-key : ${key}`);
			console.log('\n');
			console.log('New Game:');
		}
	}
})(values);


















































