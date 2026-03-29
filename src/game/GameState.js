const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

class GameState {
  constructor() {
    this.party = [];

    this.supplies = {
      food: 0,
      oxen: 0,
      clothing: 0,
      ammunition: 0,
      wheels: 0,
      axles: 0,
      tongues: 0,
    };

    this.money = 0;
    this.profession = null; // 'banker' | 'carpenter' | 'farmer'

    this.date = { month: 3, day: 1, year: 1848 }; // March 1, 1848

    this.milesTraveled = 0;
    this.pace = 'steady'; // 'steady' | 'strenuous' | 'grueling'
    this.rations = 'filling'; // 'filling' | 'meager' | 'bare-bones'

    this.nextLandmarkIndex = 0;
    this.weather = 'clear';
    this.morale = 5; // 1-10
  }

  // ── Date helpers ──────────────────────────────────────────────

  advanceDay(miles) {
    this.milesTraveled += miles;
    this.addDays(1);
  }

  addDays(n) {
    for (let i = 0; i < n; i++) {
      this.date.day += 1;
      const maxDays = DAYS_IN_MONTH[this.date.month - 1] || 30;
      if (this.date.day > maxDays) {
        this.date.day = 1;
        this.date.month += 1;
        if (this.date.month > 12) {
          this.date.month = 1;
          this.date.year += 1;
        }
      }
    }
  }

  getDateString() {
    const monthName = MONTHS[this.date.month - 1] || 'Unknown';
    return `${monthName} ${this.date.day}, ${this.date.year}`;
  }

  // ── Food / rations ────────────────────────────────────────────

  consumeFood() {
    const alive = this.getLivingCount();
    let poundsPerPerson;
    switch (this.rations) {
      case 'filling':
        poundsPerPerson = 3;
        break;
      case 'meager':
        poundsPerPerson = 2;
        break;
      case 'bare-bones':
        poundsPerPerson = 1;
        break;
      default:
        poundsPerPerson = 3;
    }
    const consumed = alive * poundsPerPerson;
    this.supplies.food = Math.max(0, this.supplies.food - consumed);
    return consumed;
  }

  // ── Party helpers ─────────────────────────────────────────────

  isPartyAlive() {
    return this.party.some((m) => m.health !== 'dead');
  }

  getAliveMembers() {
    return this.party.filter((m) => m.health !== 'dead');
  }

  getLivingCount() {
    return this.getAliveMembers().length;
  }

  /**
   * Returns an overall party health string based on the average
   * condition of living members.
   */
  getHealthStatus() {
    const alive = this.getAliveMembers();
    if (alive.length === 0) return 'dead';

    const healthValues = { good: 4, fair: 3, poor: 2, 'very poor': 1, dead: 0 };
    const sum = alive.reduce((acc, m) => acc + (healthValues[m.health] || 0), 0);
    const avg = sum / alive.length;

    if (avg >= 3.5) return 'good';
    if (avg >= 2.5) return 'fair';
    if (avg >= 1.5) return 'poor';
    return 'very poor';
  }

  /**
   * Profession scoring multiplier — higher means more points.
   * Farmer gets the biggest bonus because the game is hardest with less money.
   */
  getProfessionMultiplier() {
    switch (this.profession) {
      case 'banker':
        return 1;
      case 'carpenter':
        return 2;
      case 'farmer':
        return 3;
      default:
        return 1;
    }
  }
}

module.exports = GameState;
