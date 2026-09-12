(function() {
    function hasFontAwesome() {
        try {
            var testIcon = document.createElement('i');
            testIcon.className = 'fas fa-home';
            document.body.appendChild(testIcon);
            var ok = window.getComputedStyle(testIcon, '::before').getPropertyValue('content') !== 'none';
            document.body.removeChild(testIcon);
            return ok;
        } catch(e) { return false; }
    }
    function fallbackIcons() {
        if (hasFontAwesome()) return;
        var map = {
            'fa-home': '\u2302', 'fa-cog': '\u2699', 'fa-chart-bar': '\u2261',
            'fa-play': '\u25B6', 'fa-pause': '\u23F8', 'fa-volume-up': '\u266A',
            'fa-volume-mute': '\u240C', 'fa-sync-alt': '\u21BB', 'fa-save': '\u21E7',
            'fa-search': '\u2315', 'fa-clock': '\u23F0', 'fa-bell': '\u237E',
            'fa-users': '\u224E', 'fa-users-cog': '\u2699', 'fa-check-circle': '\u25CF',
            'fa-exclamation-circle': '\u26A0', 'fa-exclamation-triangle': '\u26A0',
            'fa-ban': '\u2298', 'fa-trash': '\u2423', 'fa-download': '\u21E9',
            'fa-file-export': '\u21E4', 'fa-file-import': '\u21E5',
            'fa-chevron-down': '\u25BC', 'fa-chevron-up': '\u25B2',
            'fa-moon': '\u263D', 'fa-microphone': '\u266C',
            'fa-info-circle': '\u24D8', 'fa-building': '\u2302',
            'fa-paper-plane': '\u27A4', 'fa-chart-line': '\u2261',
            'fa-check': '\u2713', 'fa-times': '\u2717', 'fa-times-circle': '\u2717',
            'fa-hand-paper': '\u270B', 'fa-hourglass-half': '\u23D3',
            'fa-id-card': '\u24C7', 'fa-comments': '\u275E',
            'fa-redo': '\u21BB', 'fa-undo': '\u21B6', 'fa-tools': '\u2692',
            'fa-music': '\u266B', 'fa-bolt': '\u26A1', 'fa-volume-down': '\u2669',
            'fa-gamepad': '\u25B7', 'fa-briefcase': '\u224F', 'fa-filter': '\u25B3',
            'fa-file-alt': '\u2630', 'fa-plus': '\u002B', 'fa-minus': '\u2212',
            'fa-chevron-right': '\u25B6', 'fa-chevron-left': '\u25C0',
            'fa-sun': '\u2600', 'fa-star': '\u2605', 'fa-dashboard': '\u2261',
            'fa-caret-down': '\u25BE', 'fa-caret-up': '\u25B4',
            'fa-arrow-right': '\u2192', 'fa-arrow-left': '\u2190',
            'fa-arrow-up': '\u2191', 'fa-arrow-down': '\u2193',
            'fa-envelope': '\u2709', 'fa-eye': '\u25C9',
            'fa-external-link-alt': '\u21D7', 'fa-clipboard': '\u29C9',
            'fa-file': '\u2630', 'fa-folder': '\u25B6', 'fa-folder-open': '\u25BC',
            'fa-key': '\u26BF', 'fa-lock': '\u26C3', 'fa-unlock': '\u26C1',
            'fa-pencil-alt': '\u270E', 'fa-phone': '\u260E', 'fa-print': '\u2399',
            'fa-question-circle': '\u24D8', 'fa-rocket': '\u25B3',
            'fa-shield-alt': '\u26E8', 'fa-signal': '\u26A0',
            'fa-tag': '\u25C9', 'fa-tags': '\u25C8', 'fa-thumbs-up': '\u25B3',
            'fa-thumbs-down': '\u25BD', 'fa-trash-alt': '\u2423',
            'fa-user': '\u263A', 'fa-warning': '\u26A0', 'fa-wrench': '\u2692',
            'fa-camera': '\u25C9', 'fa-close': '\u2717', 'fa-refresh': '\u21BB',
            'fa-remove': '\u2717', 'fa-gear': '\u2699', 'fa-bars': '\u2261',
            'fa-navicon': '\u2261', 'fa-reorder': '\u2261',
            'fa-file-text': '\u2630', 'fa-file-lines': '\u2630',
            'fa-line-chart': '\u2261', 'fa-area-chart': '\u2261',
            'fa-bar-chart': '\u2261', 'fa-pie-chart': '\u25D0',
            'fa-twitter': '\u25B3', 'fa-facebook': '\u25B3',
            'fa-github': '\u25B3', 'fa-telegram': '\u27A4',
            'fa-whatsapp': '\u260E', 'fa-skype': '\u260E',
            'fa-vk': '\u25B3', 'fa-odnoklassniki': '\u25B3',
            'fa-linkedin': '\u25B3', 'fa-instagram': '\u25C9',
            'fa-youtube': '\u25B6', 'fa-vimeo': '\u25B6',
            'fa-flickr': '\u25C9', 'fa-pinterest': '\u25C9',
            'fa-dribbble': '\u25C9', 'fa-behance': '\u25C9',
            'fa-tumblr': '\u25B3', 'fa-reddit': '\u25B3',
            'fa-stumbleupon': '\u25B3', 'fa-digg': '\u25B3',
            'fa-delicious': '\u25C9', 'fa-blogger': '\u25B3',
            'fa-wordpress': '\u25C9', 'fa-joomla': '\u25C9',
            'fa-drupal': '\u25C9', 'fa-magento': '\u25C9',
            'fa-php': '\u25B3', 'fa-mysql': '\u25C9',
            'fa-html5': '\u25B3', 'fa-css3': '\u25B3',
            'fa-js': '\u25B3', 'fa-python': '\u25B3',
            'fa-java': '\u25B3', 'fa-cplusplus': '\u25B3',
            'fa-node-js': '\u25B3', 'fa-npm': '\u25B3',
            'fa-git': '\u25B3', 'fa-docker': '\u25C9',
            'fa-aws': '\u25C9', 'fa-android': '\u25C9',
            'fa-apple': '\u25C9', 'fa-windows': '\u25C9',
            'fa-linux': '\u25C9', 'fa-chrome': '\u25C9',
            'fa-firefox': '\u25C9', 'fa-edge': '\u25C9',
            'fa-safari': '\u25C9', 'fa-opera': '\u25C9',
            'fa-ie': '\u25C9', 'fa-500px': '\u25C9'
        };
        var els = document.querySelectorAll('i[class*="fa-"]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var cls = el.className;
            var found = false;
            for (var key in map) {
                if (cls.indexOf(key) !== -1) {
                    el.textContent = map[key];
                    el.style.fontStyle = 'normal';
                    found = true;
                    break;
                }
            }
            if (!found) {
                el.textContent = '\u25C9';
                el.style.fontStyle = 'normal';
            }
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fallbackIcons);
    } else {
        fallbackIcons();
    }
    setTimeout(fallbackIcons, 2000);
})();
