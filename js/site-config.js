(function () {
  var host = window.location.hostname;
  var port = window.location.port;
  var protocol = window.location.protocol;
  var isLocal = host === 'localhost' || host === '127.0.0.1';

  var platformUrl;
  var websiteUrl;

  if (isLocal && (port === '5173' || port === '5174')) {
    platformUrl = window.location.origin;
    websiteUrl = window.location.origin;
  } else if (isLocal && port === '3001') {
    platformUrl = window.location.origin;
    websiteUrl = window.location.origin;
  } else if (isLocal && port === '8080') {
    platformUrl = protocol + '//' + host + ':5173';
    websiteUrl = window.location.origin;
  } else if (port === '3001' || (!isLocal && !port)) {
    platformUrl = window.location.origin;
    websiteUrl = window.location.origin;
  } else if (isLocal) {
    platformUrl = protocol + '//' + host + ':5173';
    websiteUrl = window.location.origin;
  } else {
    platformUrl = window.location.origin;
    websiteUrl = window.location.origin;
  }

  window.AG_SITE = {
    platformUrl: platformUrl,
    websiteUrl: websiteUrl,
    websiteHomeUrl: function () {
      return websiteUrl.replace(/\/$/, '') + '/index.html';
    },
    loginUrl: function (role) {
      return platformUrl + '/login/' + role;
    },
    goToWebsiteHome: function (event) {
      if (event && event.preventDefault) event.preventDefault();
      window.location.assign(window.AG_SITE.websiteHomeUrl());
    }
  };

  function applySiteLinks() {
    document.querySelectorAll('[data-platform-role]').forEach(function (el) {
      var role = el.getAttribute('data-platform-role');
      if (role) el.setAttribute('href', window.AG_SITE.loginUrl(role));
    });
    document.querySelectorAll('[data-platform-hub]').forEach(function (el) {
      el.setAttribute('href', window.AG_SITE.platformUrl + '/portals');
    });
    document.querySelectorAll('[data-website-home]').forEach(function (el) {
      el.setAttribute('href', window.AG_SITE.websiteHomeUrl());
      el.addEventListener('click', window.AG_SITE.goToWebsiteHome);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySiteLinks);
  } else {
    applySiteLinks();
  }
})();
