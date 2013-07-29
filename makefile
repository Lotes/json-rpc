all: compile run

compile:
	pegjs --track-line-and-column big-canvas-types.grammar big-canvas-types.js

run:
	node big-canvas-test.js