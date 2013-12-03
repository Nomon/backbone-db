REPORTER = spec

test: jshint
	@./node_modules/.bin/mocha --ui tdd --reporter $(REPORTER) $(T) $(TESTS)

jshint:
	@./node_modules/.bin/jshint $(shell find lib -type f)

.PHONY: test
