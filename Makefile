.PHONY: create-game
create-game:
	yarn exec ts-node --transpileOnly src/create-game.ts


.PHONY: make-move
make-move:
	yarn exec ts-node --transpileOnly src/make-move.ts

.PHONY: update-games
update-games:
	yarn exec ts-node --transpileOnly src/update-games.ts
