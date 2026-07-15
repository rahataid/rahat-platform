#!/usr/bin/env node
/**
 * Arrow-key prompt helper for run.sh
 * Usage: node lib/prompt.js <type> <message> [choice1] [choice2] ...
 *   type: "list" (single pick) or "confirm" (yes/no)
 * Prints the selected value to stdout on the last line.
 */

const inquirer = require('inquirer');
const prompt = inquirer.prompt ?? inquirer.default?.prompt;

const [, , type, message, ...choices] = process.argv;

async function main() {
	const outFile = process.env.PROMPT_RESULT_FILE;

	if (type === 'list') {
		const { answer } = await prompt([
			{
				type: 'list',
				name: 'answer',
				message,
				choices: choices.map((c) => ({ name: c, value: c })),
			},
		]);
		if (outFile) {
			require('fs').writeFileSync(outFile, answer);
		} else {
			process.stdout.write(answer + '\n');
		}
	} else if (type === 'confirm') {
		const { answer } = await prompt([
			{
				type: 'confirm',
				name: 'answer',
				message,
				default: true,
			},
		]);
		const val = answer ? 'yes' : 'no';
		if (outFile) {
			require('fs').writeFileSync(outFile, val);
		} else {
			process.stdout.write(val + '\n');
		}
	} else {
		process.stderr.write(`Unknown type: ${type}\n`);
		process.exit(1);
	}
}

main().catch((err) => {
	process.stderr.write(err.message + '\n');
	process.exit(1);
});
