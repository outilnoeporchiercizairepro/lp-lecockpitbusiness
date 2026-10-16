/* ==========================================================================
   API Conversions Meta — landings des guides.
   À l'envoi du formulaire ActiveCampaign intégré, on transmet le lead au
   webhook n8n (qui relaie à Meta côté serveur) avec un event_id partagé :
   la page merci envoie le Lead navigateur avec le même eventID, Meta
   déduplique les deux. Ne bloque jamais l'envoi du formulaire.
   ========================================================================== */
(function () {
  'use strict';

  var WEBHOOK = 'https://n8n.prcz.fr/webhook/meta-capi-lead';
  var CLE_ID = 'meta_lead_event_id';
  var CLE_TEST = 'meta_test_event_code';

  var script = document.currentScript;
  var guide = script && script.getAttribute('data-guide');
  if (!guide) return;

  function cookie(nom) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + nom + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : undefined;
  }

  function stocker(cle, valeur) {
    try { localStorage.setItem(cle, valeur); } catch (e) {}
  }

  // Code de test Meta passé dans l'URL : gardé pour la page merci.
  var codeTest = new URLSearchParams(location.search).get('test_event_code');
  if (codeTest) stocker(CLE_TEST, codeTest);

  function nouvelId() {
    if (window.crypto && crypto.randomUUID) return 'lead-' + crypto.randomUUID();
    return 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  document.addEventListener('submit', function (e) {
    try {
      var form = e.target;
      if (!form || !form.closest || !form.closest('.guide-form')) return;
      var champ = form.querySelector('[name="email"]');
      var email = champ && champ.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

      var eventId = nouvelId();
      stocker(CLE_ID, eventId);

      var donnees = {
        email: email,
        event_id: eventId,
        guide: guide,
        event_source_url: location.href,
        fbp: cookie('_fbp'),
        fbc: cookie('_fbc')
      };
      if (codeTest) donnees.test_event_code = codeTest;

      var corps = JSON.stringify(donnees);
      if (window.fetch) {
        fetch(WEBHOOK, {
          method: 'POST',
          mode: 'cors',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: corps
        }).catch(function () {});
      } else if (navigator.sendBeacon) {
        navigator.sendBeacon(WEBHOOK, new Blob([corps], { type: 'application/json' }));
      }
    } catch (err) { /* le formulaire passe quoi qu'il arrive */ }
  }, true);
})();
