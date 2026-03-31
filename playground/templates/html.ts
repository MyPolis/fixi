/**
 * HTML template tag for syntax highlighting in IDEs.
 * Just returns the interpolated string - provides IDE language support.
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
	return strings.reduce((result, str, i) => {
		const value = values[i] ?? "";
		return result + str + String(value);
	}, "");
}
