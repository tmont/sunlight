module.exports = {
	customTokens: {
		increment: {
			values: ['>'],
			boundary: ''
		},
		decrement: {
			values: ['<'],
			boundary: ''
		},
		incrementPointer: {
			values: ['+'],
			boundary: ''
		},
		decrementPointer: {
			values: ['-'],
			boundary: ''
		},
		write: {
			values: ['.'],
			boundary: ''
		},
		read: {
			values: [','],
			boundary: ''
		},
		openLoop: {
			values: ['['],
			boundary: ''
		},
		closeLoop: {
			values: [']'],
			boundary: ''
		}
	}
};
