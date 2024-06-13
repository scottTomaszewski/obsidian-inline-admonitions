import {appendOpacityToHexColor, convertAlphaToHex} from "../src/utils";

describe('testing appendOpacityToHexColor', () => {
	test('Golden paths', () => {
		expect(appendOpacityToHexColor("#000000", 100)).toBe("#000000FF");
		expect(appendOpacityToHexColor("#000000", 0)).toBe("#00000000");
		expect(appendOpacityToHexColor("#000000", 50)).toBe("#00000080");
	});
});

describe('testing convertAlphaToHex', () => {
	test('Golden paths', () => {
		expect(convertAlphaToHex(100)).toBe("FF");
		expect(convertAlphaToHex(50)).toBe("80");
		expect(convertAlphaToHex(0)).toBe("00");
		expect(convertAlphaToHex(36)).toBe("5C");
	});
});
