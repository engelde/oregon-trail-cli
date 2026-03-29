const store = `
{yellow-fg}        _______________________________________________
       /                                               \\
      /     {bold}{white-fg}MATT'S GENERAL STORE{/white-fg}{/bold}{yellow-fg}                        \\
     /=================================================\\
     |  _______    _____________________    _______    |
     | |       |  |                     |  |       |   |
     | | {cyan-fg}TOOLS{/cyan-fg}{yellow-fg} |  |    {green-fg}W E L C O M E{/green-fg}{yellow-fg}    |  | {cyan-fg}GOODS{/cyan-fg}{yellow-fg} |   |
     | |       |  |                     |  |       |   |
     | |_______|  |    ___      ___     |  |_______|   |
     |            |   |   |    |   |    |              |
     |            |   | O |    | P |    |              |
     |____________|___|___|____|___|____|______________|
  {/yellow-fg}{white-fg}^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^{/white-fg}`;

const sun = `
{yellow-fg}{bold}  \\|/
 -- O --
  /|\\{/bold}{/yellow-fg}`;

const rain = `
{white-fg}  .---.{/white-fg}
{white-fg} ( {blue-fg}~ ~{/blue-fg}{white-fg} ){/white-fg}
{cyan-fg}  / / /{/cyan-fg}
{blue-fg} / / /{/blue-fg}`;

const snow = `
{white-fg}  .---.
 ({/white-fg} {bold}* *{/bold} {white-fg})
  * {bold}*{/bold} *
 {bold}*{/bold} * {bold}*{/bold}{/white-fg}`;

const clouds = `
{white-fg}    .---.
 .-(     ).-.
(  {bold}clouds{/bold}   )
 '-.._...-'{/white-fg}`;

const campfire = `
{yellow-fg}       )
{red-fg}      ) \\{/red-fg}
     {red-fg}({/red-fg}{yellow-fg} ^ {red-fg}){/red-fg}
    {red-fg}({/red-fg}{yellow-fg} {bold}^{/bold} ^ {red-fg}){/red-fg}
   {red-fg}({/red-fg}{yellow-fg}  {bold}^{/bold}  {red-fg}){/red-fg}
{/yellow-fg}{yellow-fg}  ==={bold}\\||/{/bold}===
     {bold}XXXX{/bold}
    {bold}XX  XX{/bold}{/yellow-fg}`;

const gameOver = `
{red-fg}{bold}
  ####    ###   ##   ## #####
 ##      ## ##  ### ### ##
 ## ### ###### ## # ## ####
 ##  ## ##  ## ##   ## ##
  ####  ##  ## ##   ## #####

  ####  ##   ## ##### #####
 ##  ## ##   ## ##    ##  ##
 ##  ##  ## ##  ####  #####
 ##  ##  ## ##  ##    ## ##
  ####    ###   ##### ##  ##
{/bold}{/red-fg}`;

const victory = `
{yellow-fg}           *   *   *   *   *{/yellow-fg}
{cyan-fg}        *    *    *    *    *{/cyan-fg}
{yellow-fg}  * * * * * * * * * * * * * * * *{/yellow-fg}
{green-fg}  =========================================
  |{/green-fg}{bold}{yellow-fg}    C O N G R A T U L A T I O N S !{/yellow-fg}{/bold}{green-fg}    |
  |{/green-fg}{bold}{white-fg}     You have reached Oregon!{/white-fg}{/bold}{green-fg}          |
  =========================================
{/green-fg}{cyan-fg}         \\||/   \\||/   \\||/{/cyan-fg}
{green-fg}          ||     ||     ||
         /||\\   /||\\   /||\\{/green-fg}
{yellow-fg}   *  *     *  *  *     *  *{/yellow-fg}
{cyan-fg}      *  *     *     *  *{/cyan-fg}`;

const oxDead = `
{white-fg}
          .---.
         / o   \\____
    ____/    ~      \\___
   /                    \\
  |   R . I . P .   ___/
   \\_______________/
  ~~~~~~~~~~~~~~~~~~~~~~~~~~
{/white-fg}`;

const thief = `
{white-fg}     ,---.
    ( {red-fg}o o{/red-fg}{white-fg} )
  {red-fg}==={/red-fg}{white-fg}/===\\{red-fg}==={/red-fg}
    /|   |\\   {yellow-fg}~sack~{/yellow-fg}
   / |   | \\  {yellow-fg}/ oo /{/yellow-fg}
  '  '---'  '{/white-fg}`;

module.exports = { store, sun, rain, snow, clouds, campfire, gameOver, victory, oxDead, thief };
