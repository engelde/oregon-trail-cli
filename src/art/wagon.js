const wagonFrames = [
  // Frame 1: Spokes | and -, oxen legs extended
  `{white-fg}      (__){/white-fg}  {white-fg}(__){/white-fg}
{white-fg}      (oo){/white-fg}  {white-fg}(oo){/white-fg}          {yellow-fg}  ___.----.___  {/yellow-fg}
{white-fg}  /---UU----UU--{/white-fg}{yellow-fg}==[           ]=={/yellow-fg}
{white-fg}      ||    ||  {/white-fg}{yellow-fg}  [  {bold}OREGON{/bold}  ]  {/yellow-fg}
{white-fg}      ||    ||  {/white-fg}{yellow-fg}  [___________]  {/yellow-fg}
{white-fg}     //\\\\  //\\\\ {/white-fg}{yellow-fg}  ({white-fg}o{yellow-fg}--|--)--({white-fg}o{yellow-fg}--|--){/yellow-fg}
{green-fg}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/green-fg}`,

  // Frame 2: Spokes / and \, oxen legs mid-stride
  `{white-fg}      (__){/white-fg}  {white-fg}(__){/white-fg}
{white-fg}      (oo){/white-fg}  {white-fg}(oo){/white-fg}          {yellow-fg}  ___.----.___  {/yellow-fg}
{white-fg}  /---UU----UU--{/white-fg}{yellow-fg}==[           ]=={/yellow-fg}
{white-fg}      ||    ||  {/white-fg}{yellow-fg}  [  {bold}OREGON{/bold}  ]  {/yellow-fg}
{white-fg}     / \\  / \\  {/white-fg}{yellow-fg}  [___________]  {/yellow-fg}
{white-fg}    /   \\/   \\ {/white-fg}{yellow-fg}  ({white-fg}o{yellow-fg}-/--\\)-({white-fg}o{yellow-fg}-/--\\){/yellow-fg}
{green-fg}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/green-fg}`,

  // Frame 3: Spokes | and -, oxen legs together
  `{white-fg}      (__){/white-fg}  {white-fg}(__){/white-fg}
{white-fg}      (oo){/white-fg}  {white-fg}(oo){/white-fg}          {yellow-fg}  ___.----.___  {/yellow-fg}
{white-fg}  /---UU----UU--{/white-fg}{yellow-fg}==[           ]=={/yellow-fg}
{white-fg}      ||    ||  {/white-fg}{yellow-fg}  [  {bold}OREGON{/bold}  ]  {/yellow-fg}
{white-fg}      |\\    |\\  {/white-fg}{yellow-fg}  [___________]  {/yellow-fg}
{white-fg}      | \\   | \\ {/white-fg}{yellow-fg}  ({white-fg}o{yellow-fg}--|--)--({white-fg}o{yellow-fg}--|--){/yellow-fg}
{green-fg}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/green-fg}`,

  // Frame 4: Spokes \ and /, oxen legs pushing off
  `{white-fg}      (__){/white-fg}  {white-fg}(__){/white-fg}
{white-fg}      (oo){/white-fg}  {white-fg}(oo){/white-fg}          {yellow-fg}  ___.----.___  {/yellow-fg}
{white-fg}  /---UU----UU--{/white-fg}{yellow-fg}==[           ]=={/yellow-fg}
{white-fg}      ||    ||  {/white-fg}{yellow-fg}  [  {bold}OREGON{/bold}  ]  {/yellow-fg}
{white-fg}     /|   /|    {/white-fg}{yellow-fg}  [___________]  {/yellow-fg}
{white-fg}    / |  / |    {/white-fg}{yellow-fg}  ({white-fg}o{yellow-fg}-\\--/)-({white-fg}o{yellow-fg}-\\--/){/yellow-fg}
{green-fg}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/green-fg}`
];

const wagonSmall = `{yellow-fg} _.---._  {/yellow-fg}{white-fg}o o{/white-fg}
{yellow-fg}[_______]=={/yellow-fg}{white-fg}UU{/white-fg}
{yellow-fg} (o)  (o){/yellow-fg}`;

module.exports = { wagonFrames, wagonSmall };
