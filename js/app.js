/* =========================================================
   app.js — bootstraps the app, registers every route.
   Adding a new screen later: write the module, register it
   here with one line, add a link to it somewhere in the UI.
   ========================================================= */
(function boot() {
  const store = Storage.getRoot();

  Router.register('onboarding', Onboarding.render);
  Router.register('home', GardenView.render);
  Router.register('letters', LetterPicker.renderGrid);
  Router.register('letter', LetterPicker.renderLetterDetail);
  Router.register('word', WordDetail.render);
  Router.register('games', GamesHub.render);
  Router.register('play', PlayRouter.render);
  Router.register('challenge', ChallengeView.render);
  Router.register('parent', ParentDashboard.render);
  Router.register('pet', PetView.render);
  Router.register('shop', ShopView.render);

  if (!store.activeProfileId) {
    window.location.hash = 'onboarding';
  }

  Router.start();

  // Register service worker for offline iPad use (best-effort; ignore failures)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
})();
