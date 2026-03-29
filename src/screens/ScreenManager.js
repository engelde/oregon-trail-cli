class ScreenManager {
  constructor(screen) {
    this.screen = screen;
    this.currentScreen = null;
  }

  /**
   * Transition to a new screen.
   *
   * @param {Function} ScreenClass — constructor/class with create(), destroy(), onKey() methods
   * @param {Object}   props       — passed to the screen constructor
   */
  show(ScreenClass, props) {
    // Tear down whatever is currently showing
    this.destroy();

    // Instantiate the new screen
    this.currentScreen = new ScreenClass(this.screen, props);

    // Lifecycle: create widgets
    if (typeof this.currentScreen.create === 'function') {
      this.currentScreen.create();
    }

    // Wire keyboard handler if the screen defines one
    if (typeof this.currentScreen.onKey === 'function') {
      this._keyHandler = (ch, key) => {
        this.currentScreen.onKey(ch, key);
      };
      this.screen.on('keypress', this._keyHandler);
    }

    this.screen.render();
  }

  /**
   * Destroy the current screen and clean up listeners.
   */
  destroy() {
    if (!this.currentScreen) return;

    // Remove our keypress forwarder
    if (this._keyHandler) {
      this.screen.removeListener('keypress', this._keyHandler);
      this._keyHandler = null;
    }

    // Let the screen clean up its widgets
    if (typeof this.currentScreen.destroy === 'function') {
      this.currentScreen.destroy();
    }

    this.currentScreen = null;
  }
}

module.exports = ScreenManager;
