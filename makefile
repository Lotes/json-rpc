all: compile run

compile:
	pegjs --track-line-and-column json-rpc.grammar json-rpc-parser.js

run:
	node test.js
  
init:
	npm install backbone underscore