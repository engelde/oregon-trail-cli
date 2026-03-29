class WeatherSystem {
  constructor() {
    this.currentWeather = 'clear';
    this.temperature = 65;
    this._consecutiveDays = 0;
  }

  /**
   * Update weather based on month (0-11) and terrain type.
   * Terrain: 'plains', 'hills', 'mountains', 'desert', 'valley'
   */
  update(month, terrain = 'plains') {
    const season = this._getSeason(month);
    const roll = Math.random();
    const mountainBonus = terrain === 'mountains' ? 0.15 : 0;

    // Tend to keep current weather for 1-2 days for realism
    if (this._consecutiveDays > 0 && Math.random() < 0.35) {
      this._consecutiveDays--;
      this._updateTemperature(month, terrain);
      return this.currentWeather;
    }

    let weather;

    if (season === 'early_spring') {
      // March-April: cold, rain common, occasional snow
      if (roll < 0.25) weather = 'rain';
      else if (roll < 0.35) weather = 'heavy rain';
      else if (roll < 0.42 + mountainBonus) weather = 'snow';
      else if (roll < 0.47) weather = 'fog';
      else if (roll < 0.55) weather = 'cloudy';
      else weather = 'clear';
    } else if (season === 'late_spring') {
      // May-June: mild, rain possible, best travel weather
      if (roll < 0.12) weather = 'rain';
      else if (roll < 0.17) weather = 'heavy rain';
      else if (roll < 0.22) weather = 'thunderstorm';
      else if (roll < 0.27) weather = 'cloudy';
      else if (roll < 0.3) weather = 'fog';
      else weather = 'clear';
    } else if (season === 'summer') {
      // July-August: hot, drought possible, thunderstorms
      if (roll < 0.25) weather = 'hot';
      else if (roll < 0.35) weather = 'thunderstorm';
      else if (roll < 0.4) weather = 'rain';
      else if (roll < 0.48) weather = 'cloudy';
      else weather = 'clear';
    } else if (season === 'early_fall') {
      // September-October: cooling, rain, early snow in mountains
      if (roll < 0.2) weather = 'rain';
      else if (roll < 0.3) weather = 'heavy rain';
      else if (roll < 0.35 + mountainBonus) weather = 'snow';
      else if (roll < 0.4 + mountainBonus) weather = 'blizzard';
      else if (roll < 0.48) weather = 'cloudy';
      else if (roll < 0.52) weather = 'fog';
      else weather = 'clear';
    } else {
      // November+: cold, snow, blizzards in mountains
      if (roll < 0.2 + mountainBonus) weather = 'snow';
      else if (roll < 0.3 + mountainBonus) weather = 'blizzard';
      else if (roll < 0.4) weather = 'cloudy';
      else if (roll < 0.48) weather = 'rain';
      else if (roll < 0.52) weather = 'fog';
      else weather = 'clear';
    }

    this.currentWeather = weather;
    this._consecutiveDays = Math.floor(Math.random() * 3);
    this._updateTemperature(month, terrain);
    return this.currentWeather;
  }

  _getSeason(month) {
    if (month >= 2 && month <= 3) return 'early_spring';
    if (month >= 4 && month <= 5) return 'late_spring';
    if (month >= 6 && month <= 7) return 'summer';
    if (month >= 8 && month <= 9) return 'early_fall';
    return 'winter';
  }

  _updateTemperature(month, terrain) {
    const baseTempByMonth = {
      0: 25,
      1: 30,
      2: 42,
      3: 52,
      4: 63,
      5: 73,
      6: 82,
      7: 80,
      8: 70,
      9: 55,
      10: 40,
      11: 28,
    };

    let temp = baseTempByMonth[month] || 60;

    // Terrain adjustments
    if (terrain === 'mountains') temp -= 15;
    else if (terrain === 'desert') temp += 10;
    else if (terrain === 'hills') temp -= 5;

    // Weather adjustments
    if (this.currentWeather === 'hot') temp += 10;
    else if (this.currentWeather === 'snow' || this.currentWeather === 'blizzard') temp -= 15;
    else if (this.currentWeather === 'rain' || this.currentWeather === 'heavy rain') temp -= 5;

    // Random variance ±8 degrees
    temp += Math.floor(Math.random() * 17) - 8;

    this.temperature = Math.max(-10, Math.min(120, temp));
  }

  /**
   * Returns speed multiplier (0.0 to 1.0).
   */
  getSpeedModifier() {
    const modifiers = {
      clear: 1.0,
      cloudy: 1.0,
      hot: 0.85,
      fog: 0.4,
      rain: 0.75,
      'heavy rain': 0.5,
      thunderstorm: 0.35,
      snow: 0.5,
      blizzard: 0.0,
    };
    return modifiers[this.currentWeather] ?? 1.0;
  }

  /**
   * Returns health impact modifier (negative = harmful, positive = beneficial).
   * Applied per day to each party member. Scale: small decimals on 0-4 hp range.
   */
  getHealthModifier() {
    const modifiers = {
      clear: 0.02,
      cloudy: 0,
      hot: -0.03,
      fog: -0.01,
      rain: -0.02,
      'heavy rain': -0.04,
      thunderstorm: -0.03,
      snow: -0.05,
      blizzard: -0.1,
    };
    let mod = modifiers[this.currentWeather] || 0;

    // Extreme temperature penalties
    if (this.temperature > 100) mod -= 0.03;
    else if (this.temperature > 90) mod -= 0.01;
    if (this.temperature < 20) mod -= 0.03;
    else if (this.temperature < 32) mod -= 0.01;

    return mod;
  }

  /**
   * Returns an ASCII weather icon/symbol.
   */
  getWeatherIcon() {
    const icons = {
      clear: '☀',
      cloudy: '☁',
      hot: '☀🔥',
      fog: '🌫',
      rain: '🌧',
      'heavy rain': '⛈',
      thunderstorm: '⚡',
      snow: '❄',
      blizzard: '❄❄',
    };
    return icons[this.currentWeather] || '?';
  }
}

module.exports = WeatherSystem;
