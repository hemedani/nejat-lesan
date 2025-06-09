export const isValidNationalNumber = (code: string) => {
	if (code.length !== 10 || /(\d)(\1){9}/.test(code)) return false;

	let sum = 0;
	const chars = code.split("");

	for (let i = 0; i < 9; i++) sum += +chars[i] * (10 - i);

	const remainder = sum % 11;
	const lastDigit = remainder < 2 ? remainder : 11 - remainder;

	return +chars[9] === lastDigit;
};
