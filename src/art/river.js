function riverScene(width, depth) {
  const bankTop = [];
  const water = [];
  const bankBottom = [];

  // Top bank
  bankTop.push(
    '{green-fg}vvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvV{/green-fg}',
    '{green-fg} ^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^{/green-fg}',
    '{yellow-fg}.:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:.:{/yellow-fg}',
  );

  // Water rows depend on width and depth
  let waterWidth, padding;
  if (width === 'narrow') {
    waterWidth = 30;
    padding = 24;
  } else if (width === 'wide') {
    waterWidth = 78;
    padding = 0;
  } else {
    waterWidth = 54;
    padding = 12;
  }

  const _padStr = ' '.repeat(padding);
  const halfPad = ' '.repeat(Math.floor(padding / 2));

  const shallowRows = [
    '~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~ ',
    ' ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~ ',
    '  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ',
    '~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~  ',
    ' ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ',
    '~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~ ',
  ];

  const deepRows = [
    '≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈',
    '~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈',
    '≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈≈~≈~≈',
    '≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈',
    '~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈',
    '≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈≈≈~≈',
    '≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈~≈≈',
    '~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~~≈≈~',
  ];

  const rows = depth === 'deep' ? deepRows : shallowRows;
  const color = depth === 'deep' ? 'blue' : 'cyan';

  let waterCount;
  if (width === 'narrow') {
    waterCount = 5;
  } else if (width === 'wide') {
    waterCount = 8;
  } else {
    waterCount = 6;
  }

  for (let i = 0; i < waterCount; i++) {
    const row = rows[i % rows.length];
    const trimmed = row.substring(0, waterWidth).padEnd(waterWidth);
    if (padding > 0) {
      water.push(
        `{yellow-fg}${halfPad.substring(0, Math.floor(padding / 2))}{/yellow-fg}` +
          `{${color}-fg}${trimmed}{/${color}-fg}` +
          `{yellow-fg}${halfPad.substring(0, Math.floor(padding / 2))}{/yellow-fg}`,
      );
    } else {
      water.push(`{${color}-fg}${trimmed}{/${color}-fg}`);
    }
  }

  // Bottom bank
  bankBottom.push(
    '{yellow-fg}.:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:.:{/yellow-fg}',
    '{green-fg} ^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^{/green-fg}',
    '{green-fg}vvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvV{/green-fg}',
  );

  return [...bankTop, ...water, ...bankBottom].join('\n');
}

const raft =
  '{yellow-fg} _____ {/yellow-fg}\n' +
  '{yellow-fg}|{bold}====={/bold}|{/yellow-fg}\n' +
  '{yellow-fg}|_____|{/yellow-fg}';

const rock = '{white-fg}  /\\  {/white-fg}\n' + '{white-fg} /  \\ {/white-fg}\n' + '{white-fg}/____\\{/white-fg}';

const riverBank =
  '{green-fg}vv{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}Vv{/green-fg}{yellow-fg}:{/yellow-fg}{green-fg}vV{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}vv{/green-fg}{yellow-fg}:{/yellow-fg}{green-fg}Vv{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}vV{/green-fg}{yellow-fg}:{/yellow-fg}{green-fg}vv{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}Vv{/green-fg}{yellow-fg}:{/yellow-fg}{green-fg}vV{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}vv{/green-fg}{yellow-fg}:{/yellow-fg}{green-fg}Vv{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}vV{/green-fg}{yellow-fg}:{/yellow-fg}{green-fg}vv{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}Vv{/green-fg}{yellow-fg}:{/yellow-fg}{green-fg}vV{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}vv{/green-fg}{yellow-fg}:{/yellow-fg}{green-fg}Vv{/green-fg}{yellow-fg}.{/yellow-fg}{green-fg}vV{/green-fg}\n' +
  '{yellow-fg}..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..{/yellow-fg}\n' +
  '{green-fg} "^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^"^^^" {/green-fg}';

module.exports = { riverScene, raft, rock, riverBank };
