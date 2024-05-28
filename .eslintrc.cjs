module.exports = {
	env: {
		es2021: true,
		node: true,
	},
	globals: {
		process: "readonly",
	},
	extends: ["eslint:recommended"],
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	rules: {
		"no-undef": ["error", { typeof: true }],
		"no-global-assign": ["error", { exceptions: ["process"] }],
	},
};
