export function slugify(str: any) {
	return String(str)
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.trim() // trim leading or trailing whitespace
		.toLowerCase() // convert to lowercase
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-'); // remove consecutive hyphens
}

// Function to encode arbitrary characters into a valid format
export function encodeChar(char: string): string {
	const charCode = char.charCodeAt(0);
	return `_x${charCode.toString(16).padStart(4, '0')}_`;
}

/**
 * Sanitizes a string to create a valid CSS class name.
 * @param input - The input string to be sanitized.
 * @returns A valid CSS class name.
 */
export function sanitizeClassName(input: string): string {
	// Ensure the input is a string and trim whitespace
	input = input.trim();

	// Add underscore prefix if the first character is invalid
	if (!/^[a-zA-Z_]/.test(input.charAt(0))) {
		input = '_' + input;
	}
	return input.split('').map(char => {
		// Valid characters for CSS class names
		if (/^[a-zA-Z0-9\-_]$/.test(char)) {
			return char;
		} else {
			// Encode any invalid characters
			return encodeChar(char);
		}
	}).join('');
}



export function appendOpacityToHexColor(hexColor: string, opacityPercent: number): string {
	// Cleanup and remove leading #
	const hexCode = hexColor
		.trim()
		.replace(/^#/g, '')
		.substring(0, 6);
	return "#" + hexCode + convertAlphaToHex(opacityPercent);
}

// Source: https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4?permalink_comment_id=4545640#gistcomment-4545640
export function convertAlphaToHex(alphaDecimal: number) {
	// If there is no value, assume 100%
	if (alphaDecimal == null) {
		return "FF";
	}
	// Convert alphaDecimal to a value between 0 and 1
	const alpha = alphaDecimal / 100;

	// Calculate the equivalent alpha value in the range of 0 to 255
	const alphaInt = Math.round(alpha * 255);

	// Convert alphaInt to hexadecimal string
	const alphaHex = alphaInt.toString(16).toUpperCase();

	// Pad the hexadecimal value with leading zero if needed
	const paddedAlphaHex = alphaHex.padStart(2, '0');

	return paddedAlphaHex;
}
