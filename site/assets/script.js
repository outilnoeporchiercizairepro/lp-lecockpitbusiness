/* ==========================================================================
   Altitude — comportements de page
   ========================================================================== */

(function () {
  'use strict';

  /* --- 1. Lien de réservation ------------------------------------------
     UNE SEULE destination pour tous les CTA de la page.
     Remplacer la valeur ci-dessous par le lien de réservation.
     Tant qu'elle vaut null, les CTA restent inertes et sont signalés
     dans la console — pour éviter de mettre en ligne des boutons morts. */

  var BOOKING_URL = 'https://cal.com/noe-porchier-cizaire/bilan-strategique-ia?utm_source=lp';

  var ctas = document.querySelectorAll('[data-booking]');

  if (BOOKING_URL) {
    Array.prototype.forEach.call(ctas, function (el) {
      el.setAttribute('href', BOOKING_URL);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });
  } else if (ctas.length) {
    console.warn(
      '[Le Cockpit Business] BOOKING_URL n\'est pas renseigné dans assets/script.js — ' +
      ctas.length + ' CTA sans destination.'
    );
    Array.prototype.forEach.call(ctas, function (el) {
      el.setAttribute('aria-disabled', 'true');
      el.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  /* --- 2. Retour en haut ---------------------------------------------------
     Le logo et « Accueil » visaient auparavant l'ancre posée sur la barre de
     navigation. Celle-ci étant en position sticky, elle est déjà en haut de
     l'écran dès qu'on a défilé : le navigateur n'avait rien à faire défiler.

     On anime nous-mêmes plutôt que d'utiliser behavior:'smooth', dont la
     courbe est quasi linéaire et devient désagréable sur une page longue. */

  var remontee = null;

  /* easeInOutQuart : départ posé, milieu rapide, arrivée qui se dépose. */
  var adoucir = function (t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  };

  var remonter = function () {
    var depart = window.pageYOffset || document.documentElement.scrollTop;
    if (depart <= 0) return;

    /* Onglet masqué : requestAnimationFrame ne se déclenche pas, l'animation
       ne partirait jamais. Même chose si le système demande de réduire les
       animations. Dans les deux cas, on remonte sèchement. */
    if (document.hidden ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0);
      return;
    }

    /* Durée proportionnelle à la distance, plafonnée : la même courbe pour
       500 px et pour 12 000 px donnerait une vitesse de pointe intenable. */
    var duree = Math.min(1150, 460 + depart * 0.1);
    var racine = document.documentElement;
    var comportementInitial = racine.style.scrollBehavior;
    var debut = null;

    /* Le scroll-behavior:smooth du CSS animerait chaque scrollTo de la boucle
       et se battrait avec elle : on le neutralise le temps de l'animation. */
    racine.style.scrollBehavior = 'auto';

    var arreter = function () {
      if (remontee) cancelAnimationFrame(remontee);
      remontee = null;
      racine.style.scrollBehavior = comportementInitial;
      window.removeEventListener('wheel', arreter);
      window.removeEventListener('touchstart', arreter);
      window.removeEventListener('keydown', arreter);
    };

    /* Toute intervention de l'utilisateur reprend la main sur l'animation. */
    window.addEventListener('wheel', arreter, { passive: true });
    window.addEventListener('touchstart', arreter, { passive: true });
    window.addEventListener('keydown', arreter);

    var etape = function (temps) {
      if (debut === null) debut = temps;
      var avance = Math.min(1, (temps - debut) / duree);
      window.scrollTo(0, depart * (1 - adoucir(avance)));
      if (avance < 1) remontee = requestAnimationFrame(etape);
      else arreter();
    };

    if (remontee) cancelAnimationFrame(remontee);
    remontee = requestAnimationFrame(etape);
  };

  Array.prototype.forEach.call(document.querySelectorAll('[data-top]'), function (lien) {
    lien.addEventListener('click', function (e) {
      e.preventDefault();
      remonter();
      /* On efface le « # » que le clic laisserait dans l'URL. */
      if (window.history && history.replaceState) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
  });

  /* --- 3. Filet de la navigation au défilement -------------------------- */

  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- 4. Photos absentes : rattrapage ------------------------------------
     L'écoute principale est dans l'en-tête d'index.html, posée avant que les
     images ne se chargent. Ce balayage ne couvre que les échecs déjà résolus
     au moment où ce script s'exécute — il doit passer avant la duplication du
     bandeau, pour que les copies ne reprennent pas d'images mortes. */

  Array.prototype.forEach.call(
    document.querySelectorAll('img[data-photo]'),
    function (img) { if (img.complete && img.naturalWidth === 0) img.remove(); }
  );

  /* --- 5. Bandeau défilant : autant de séries qu'il en faut ---------------
     La série est dupliquée jusqu'à ce que le total dépasse la largeur du
     cadre. Il faut toujours une série de plus que ce que l'écran affiche :
     chaque série se décale de sa propre largeur, donc en fin de cycle le
     contenu ne couvre plus que (nombre de séries − 1) × largeur de série. */

  var marquee = document.querySelector('[data-marquee]');

  if (marquee) {
    var serieWidth = 0;

    var fillMarquee = function () {
      var first = marquee.firstElementChild;
      if (!first) return;

      serieWidth = serieWidth || first.getBoundingClientRect().width;
      if (!serieWidth) return;

      var series = marquee.children.length;
      var needed = Math.ceil(marquee.clientWidth / serieWidth) + 2;

      for (var i = series; i < needed; i++) {
        var copy = first.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        marquee.appendChild(copy);
      }
    };

    fillMarquee();
    window.addEventListener('resize', fillMarquee, { passive: true });

    /* Les polices modifient la largeur d'une série : on recalcule une fois
       chargées, sinon le compte est fait sur la police de repli. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        serieWidth = 0;
        fillMarquee();
      });
    }
  }

  /* --- 6. Courbe de performance : navigation par jalon --------------------
     Les abscisses et ordonnées reprennent celles du <svg> dans index.html
     (viewBox 1000 × 270) : les modifier des deux côtés à la fois.
     Sans JS les cinq panneaux restent affichés à la suite — le contenu
     demeure lisible et indexable, ce script se contente d'en masquer quatre. */

  var courbe = document.querySelector('[data-ramp]');

  if (courbe) {
    var onglets = Array.prototype.slice.call(courbe.querySelectorAll('[role="tab"]'));
    var panneaux = Array.prototype.slice.call(
      document.querySelectorAll('.ramp__panels [role="tabpanel"]'));

    var reperesAxe = Array.prototype.slice.call(courbe.querySelectorAll('.ramp__axis-item'));

    var repere  = courbe.querySelector('.ramp__guide');
    var pastille = courbe.querySelector('.ramp__marker');
    var etiquette = courbe.querySelector('.ramp__flag');

    var ABSCISSES = [100, 300, 500, 700, 900];
    var ORDONNEES = [245, 201, 142.5, 84, 40];
    var HEURES    = ['+0h', '+3h', '+7h', '+11h', '+14h'];

    var choisir = function (i, donnerLeFocus) {
      onglets.forEach(function (onglet, j) {
        var actif = j === i;
        onglet.setAttribute('aria-selected', actif ? 'true' : 'false');
        onglet.tabIndex = actif ? 0 : -1;
      });
      panneaux.forEach(function (panneau, j) { panneau.hidden = j !== i; });
      reperesAxe.forEach(function (repereAxe, j) {
        if (j === i) repereAxe.setAttribute('data-actif', '');
        else repereAxe.removeAttribute('data-actif');
      });

      repere.setAttribute('x1', ABSCISSES[i]);
      repere.setAttribute('x2', ABSCISSES[i]);
      repere.setAttribute('y1', ORDONNEES[i]);

      pastille.setAttribute('cx', ABSCISSES[i]);
      pastille.setAttribute('cy', ORDONNEES[i]);

      etiquette.setAttribute('x', ABSCISSES[i]);
      etiquette.setAttribute('y', ORDONNEES[i] - 18);
      etiquette.textContent = HEURES[i];

      if (donnerLeFocus) onglets[i].focus();
    };

    onglets.forEach(function (onglet, i) {
      onglet.addEventListener('click', function () { choisir(i); });
      onglet.addEventListener('keydown', function (e) {
        var suivant = null;
        if (e.key === 'ArrowRight')     suivant = (i + 1) % onglets.length;
        else if (e.key === 'ArrowLeft') suivant = (i - 1 + onglets.length) % onglets.length;
        else if (e.key === 'Home')      suivant = 0;
        else if (e.key === 'End')       suivant = onglets.length - 1;
        if (suivant === null) return;
        e.preventDefault();
        choisir(suivant, true);
      });
    });

    /* On ouvre sur la semaine 4 : la promesse tenue avant le chemin pour y aller. */
    choisir(onglets.length - 1);
  }

  /* --- 7. Apparition au défilement --------------------------------------- */

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  }

  /* --- 8. FAQ : une seule réponse ouverte à la fois ---------------------- */

  var faqItems = document.querySelectorAll('.faq__item');
  Array.prototype.forEach.call(faqItems, function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      Array.prototype.forEach.call(faqItems, function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* --- 9. Année du copyright --------------------------------------------- */

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
