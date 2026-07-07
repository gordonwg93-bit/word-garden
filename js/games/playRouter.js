/* =========================================================
   games/playRouter.js
   Single 'play' route dispatches to the right game module by
   ?game= param. Adding a new game later = write the module,
   add one line here, add one button wherever it's launched.
   ========================================================= */
const PlayRouter = (() => {
  const GAMES = {
    listenChoose: ListenChooseGame,
    missingLetter: MissingLetterGame,
    wordBuilder: WordBuilderGame,
    sentenceBuilder: SentenceBuilderGame,
    letterTrace: LetterTraceGame,
    memoryGame: MemoryGame,
    speedQuiz: SpeedQuizGame
  };

  async function render(root, params) {
    const game = GAMES[params.game];
    if (!game) { Router.navigate('games'); return; }
    await game.render(root, params);
  }

  return { render };
})();
