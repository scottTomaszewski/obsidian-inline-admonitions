import {appendOpacityToHexColor, borderCss, convertAlphaToHex, encodeChar, sanitizeClassName, textStyleCss} from "../src/utils";

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

describe('testing borderCss', () => {
	test('default (theme) border style emits only the radius', () => {
		expect(borderCss("", 1, "#000000", 0)).toBe(" border-radius: 0px;");
	});
	test('none style emits border: none plus radius', () => {
		expect(borderCss("none", 1, "#000000", 0)).toBe(" border: none; border-radius: 0px;");
	});
	test('solid style emits full border plus radius', () => {
		expect(borderCss("solid", 2, "#ff0000", 0)).toBe(" border: 2px solid #ff0000; border-radius: 0px;");
	});
	test('dashed style with radius emits border and radius', () => {
		expect(borderCss("dashed", 1, "#000000", 5)).toBe(" border: 1px dashed #000000; border-radius: 5px;");
	});
	test('radius alone (default border) emits only radius', () => {
		expect(borderCss("", 0, "#000000", 8)).toBe(" border-radius: 8px;");
	});
	test('zero radius is emitted as a literal 0px (square corners)', () => {
		expect(borderCss("dotted", 3, "#123456", 0)).toBe(" border: 3px dotted #123456; border-radius: 0px;");
	});
});

describe('testing textStyleCss', () => {
	test('all false emits nothing', () => {
		expect(textStyleCss(false, false, false)).toBe("");
	});
	test('bold only', () => {
		expect(textStyleCss(true, false, false)).toBe(" font-weight: bold;");
	});
	test('italic only', () => {
		expect(textStyleCss(false, true, false)).toBe(" font-style: italic;");
	});
	test('underline only', () => {
		expect(textStyleCss(false, false, true)).toBe(" text-decoration: underline;");
	});
	test('all three combine in order', () => {
		expect(textStyleCss(true, true, true)).toBe(" font-weight: bold; font-style: italic; text-decoration: underline;");
	});
});
