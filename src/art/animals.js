const rabbit = `\
{white-fg}{bold}\
 (\\  /)
 ( . .)
 (")("){/bold}{/white-fg}`;

const deer = `\
{yellow-fg}{bold}\
  (\\)  (/)
   \\\\  //
    |\\_/|
    |   |
    || ||{/bold}{/yellow-fg}`;

const buffalo = `\
{yellow-fg}{bold}\
  /))      ((\\
 / /        \\ \\
|/____________\\|
|              |
 ||   ||   ||{/bold}{/yellow-fg}`;

const bear = `\
{yellow-fg}{bold}\
 (\\__    __/)
  (  o  o  )
  (  (__)  )
  (__________)
   ||      ||{/bold}{/yellow-fg}`;

const crosshair = `\
{red-fg}{bold}\
 |
-+-
 |{/bold}{/red-fg}`;

module.exports = { rabbit, deer, buffalo, bear, crosshair };
