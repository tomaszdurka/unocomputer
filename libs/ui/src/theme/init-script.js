// Inline <script> for the root layout <head>: applies the saved theme before first
// paint (no flash) and follows the OS preference live while "system" is selected.
// Pairs with AppearanceSettings, which persists the choice in localStorage.theme.
export const themeInitScript = `
(function () {
  try {
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    function apply() {
      var stored = localStorage.getItem('theme');
      var dark = stored === 'dark' || (!stored && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    }
    apply();
    media.addEventListener('change', apply);
    window.addEventListener('theme-change', apply);
  } catch (e) {}
})();
`;
