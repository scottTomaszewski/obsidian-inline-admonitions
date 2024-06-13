import {appendOpacityToHexColor, convertAlphaToHex, encodeChar, sanitizeClassName} from "../src/utils";

describe('testing encodeChar', () => {
	test('Standard', () => {
		expect(encodeChar("✘")).toBe("_x2718_");
		expect(encodeChar("!")).toBe("_x0021_");
		expect(encodeChar("✔")).toBe("_x2714_");
	});
});

describe('testing sanitizeClassName', () => {
	test('Standard', () => {
		expect(sanitizeClassName("AA")).toBe("AA");
		expect(sanitizeClassName("aa")).toBe("aa");
		expect(sanitizeClassName("a1")).toBe("a1");
		expect(sanitizeClassName("a-b")).toBe("a-b");
		expect(sanitizeClassName("1hi")).toBe("_1hi");
		expect(sanitizeClassName("✘")).toBe("__x2718_");
		expect(sanitizeClassName("!")).toBe("__x0021_");
		expect(sanitizeClassName("✔")).toBe("__x2714_");
		expect(sanitizeClassName("✘✔!")).toBe("__x2718__x2714__x0021_");
		expect(sanitizeClassName("hey-✘")).toBe("hey-_x2718_");
	});
});

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
