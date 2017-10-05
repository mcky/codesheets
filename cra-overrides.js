const regexesMatch = (regexA, regexB) => String(regexA) === String(regexB)

module.exports = (config, isDev) => {

	const jsConfig = config.module.rules.find(rule =>
		regexesMatch(rule.test, /\.(js|jsx)$/)
	)

	if (isDev) {
		jsConfig.use = []
	} else {
		jsConfig.use[0].options.baseConfig.extends = [require.resolve('./.eslintrc')]
	}

	return config
}
