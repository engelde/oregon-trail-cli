const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const WeatherSystem = require('../src/game/WeatherSystem');

describe('WeatherSystem', () => {
  describe('constructor', () => {
    it('starts with clear weather', () => {
      const ws = new WeatherSystem();
      assert.equal(ws.currentWeather, 'clear');
    });

    it('starts with reasonable temperature', () => {
      const ws = new WeatherSystem();
      assert.equal(ws.temperature, 65);
    });
  });

  describe('update', () => {
    it('returns a valid weather type', () => {
      const validWeather = ['clear', 'cloudy', 'hot', 'fog', 'rain', 'heavy rain', 'thunderstorm', 'snow', 'blizzard'];
      const ws = new WeatherSystem();
      for (let i = 0; i < 50; i++) {
        const weather = ws.update(5, 'plains');
        assert.ok(validWeather.includes(weather), `Invalid weather: ${weather}`);
      }
    });

    it('sets currentWeather to the returned value', () => {
      const ws = new WeatherSystem();
      const result = ws.update(5, 'plains');
      assert.equal(ws.currentWeather, result);
    });

    it('updates temperature within reasonable range', () => {
      const ws = new WeatherSystem();
      for (let month = 0; month < 12; month++) {
        ws.update(month, 'plains');
        assert.ok(ws.temperature >= -10, `Temperature ${ws.temperature} too low`);
        assert.ok(ws.temperature <= 120, `Temperature ${ws.temperature} too high`);
      }
    });
  });

  describe('getSpeedModifier', () => {
    it('returns 1.0 for clear weather', () => {
      const ws = new WeatherSystem();
      ws.currentWeather = 'clear';
      assert.equal(ws.getSpeedModifier(), 1.0);
    });

    it('returns 0.0 for blizzard', () => {
      const ws = new WeatherSystem();
      ws.currentWeather = 'blizzard';
      assert.equal(ws.getSpeedModifier(), 0.0);
    });

    it('returns reduced value for rain', () => {
      const ws = new WeatherSystem();
      ws.currentWeather = 'rain';
      assert.ok(ws.getSpeedModifier() < 1.0);
      assert.ok(ws.getSpeedModifier() > 0.0);
    });

    it('returns a number for all weather types', () => {
      const ws = new WeatherSystem();
      const types = ['clear', 'cloudy', 'hot', 'fog', 'rain', 'heavy rain', 'thunderstorm', 'snow', 'blizzard'];
      for (const type of types) {
        ws.currentWeather = type;
        const mod = ws.getSpeedModifier();
        assert.equal(typeof mod, 'number');
        assert.ok(mod >= 0.0 && mod <= 1.0, `Speed mod ${mod} for ${type} out of range`);
      }
    });
  });

  describe('getHealthModifier', () => {
    it('returns positive value for clear weather', () => {
      const ws = new WeatherSystem();
      ws.currentWeather = 'clear';
      ws.temperature = 70;
      assert.ok(ws.getHealthModifier() > 0);
    });

    it('returns negative value for blizzard', () => {
      const ws = new WeatherSystem();
      ws.currentWeather = 'blizzard';
      ws.temperature = 10;
      assert.ok(ws.getHealthModifier() < 0);
    });

    it('health modifiers are small decimals on 0-4 scale', () => {
      const ws = new WeatherSystem();
      const types = ['clear', 'cloudy', 'hot', 'fog', 'rain', 'heavy rain', 'thunderstorm', 'snow', 'blizzard'];
      for (const type of types) {
        ws.currentWeather = type;
        ws.temperature = 60;
        const mod = ws.getHealthModifier();
        assert.ok(Math.abs(mod) < 0.5, `Health mod ${mod} for ${type} is too large for 0-4 hp scale`);
      }
    });

    it('extreme cold adds additional penalty', () => {
      const ws = new WeatherSystem();
      ws.currentWeather = 'clear';
      ws.temperature = 70;
      const normalMod = ws.getHealthModifier();
      ws.temperature = 15;
      const coldMod = ws.getHealthModifier();
      assert.ok(coldMod < normalMod, 'Extreme cold should reduce health modifier');
    });

    it('extreme heat adds additional penalty', () => {
      const ws = new WeatherSystem();
      ws.currentWeather = 'clear';
      ws.temperature = 70;
      const normalMod = ws.getHealthModifier();
      ws.temperature = 105;
      const hotMod = ws.getHealthModifier();
      assert.ok(hotMod < normalMod, 'Extreme heat should reduce health modifier');
    });
  });

  describe('getWeatherIcon', () => {
    it('returns a string for all weather types', () => {
      const ws = new WeatherSystem();
      const types = ['clear', 'cloudy', 'hot', 'fog', 'rain', 'heavy rain', 'thunderstorm', 'snow', 'blizzard'];
      for (const type of types) {
        ws.currentWeather = type;
        assert.equal(typeof ws.getWeatherIcon(), 'string');
        assert.ok(ws.getWeatherIcon().length > 0);
      }
    });
  });
});
