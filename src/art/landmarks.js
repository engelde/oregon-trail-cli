const landmarks = {
  'Chimney Rock': `
{yellow-fg}                        .
                       /|\\
                      / | \\
                     /  |  \\
                    /   |   \\
                   |    |    |
                   |    |    |
                   |    |    |
                    \\   |   /
                     |  |  |
                     |  |  |
                     | /|\\ |{/yellow-fg}
{yellow-fg}    ___.----------{/yellow-fg}{yellow-fg}|||||||{/yellow-fg}{yellow-fg}----------.__{/yellow-fg}
{green-fg}  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/green-fg}
{green-fg}    ~~~  ~~   ~~~  prairie  ~~~   ~~  ~~~   ~~  ~~~  ~~{/green-fg}`,

  'Independence Rock': `
{white-fg}                   ___...---"""---...__
               _.-""                    ""-._
            .-"    _                         "-.
          ."    .-" "-.    {bold}J.Smith{/bold}     _        ".
        ."    ."       ".          ." ".        ".
       /    ."   {bold}1847{/bold}    ".  _     ."     ".       \\
      /    /              \\/ \\   /  {bold}Oregon{/bold}  \\       \\
     /    /    {bold}We made{/bold}    /   \\ /   {bold}or{/bold}     \\       \\
    /    /      {bold}it!{/bold}      /     Y   {bold}Bust!{/bold}    \\       \\{/white-fg}
{white-fg}   /___/_______________/______!______________\\_______\\{/white-fg}
{green-fg} ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/green-fg}
{green-fg}   ~~  ~~~  sage  ~~~  brush  ~~~  ~~  ~~~  sage  ~~~{/green-fg}`,

  'South Pass': `
{white-fg}      /\\                                          /\\
     /  \\              {bold}South Pass{/bold}                /  \\
    / /\\ \\      _                          _ / /\\ \\
   / /  \\ \\    / \\                        / \\ /  \\ \\
  / /    \\ \\  / _ \\          __          / _ \\    \\ \\{/white-fg}
{white-fg} / /      \\{/white-fg}{green-fg}\\/   \\{/green-fg}{white-fg}\\      /{/white-fg}{green-fg}  \\{/green-fg}{white-fg}        /{/white-fg}{green-fg}   \\{/green-fg}{white-fg}\\/      \\ \\{/white-fg}
{green-fg}  /        \\     \\ \\   /    \\      /     \\/        \\
 /          \\     \\ \\_/      \\    /     /          \\
/    ~~~~    \\     \\          \\  /     /    ~~~~    \\
     ~~~~     \\     \\    ~~    \\/     /     ~~~~
  trail ~~~~   \\     \\  ~~~~        /   trail ~~~~{/green-fg}
{green-fg}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/green-fg}`,

  'Soda Springs': `
{white-fg}     .---.     .---.           .---.{/white-fg}
{white-fg}    / ___ \\   / ___ \\         / ___ \\{/white-fg}
{cyan-fg}       o        o  o             o
      oOo      oOo              oOo
     o   o    o   o   o        o   o{/cyan-fg}
{blue-fg}  ~~~{/blue-fg}{cyan-fg}oOoOo{/cyan-fg}{blue-fg}~~{/blue-fg}{cyan-fg}oOoOo{/cyan-fg}{blue-fg}~~{/blue-fg}{cyan-fg}oOo{/cyan-fg}{blue-fg}~~~~{/blue-fg}{cyan-fg}oOoOo{/cyan-fg}{blue-fg}~~~{/blue-fg}
{blue-fg}  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/blue-fg}
{white-fg}  .--. {/white-fg}{blue-fg}~~~~~~{/blue-fg}{white-fg}  .--.{/white-fg}{blue-fg}  ~~~~~  {/blue-fg}{white-fg}.--. {/white-fg}{blue-fg}~~~~~{/blue-fg}
{white-fg} / oo \\ {/white-fg}{blue-fg}~~~~{/blue-fg}{white-fg}  / oo \\ {/white-fg}{blue-fg}~~~~ {/blue-fg}{white-fg}/ oo \\ {/white-fg}{blue-fg}~~~~{/blue-fg}
{green-fg}  ~~~ grass ~~~~ grass ~~~~ grass ~~~ grass{/green-fg}`,

  'Blue Mountains': `
{blue-fg}            /\\
           /  \\         /\\
     /\\   /    \\       /  \\        /\\
    /  \\ /      \\     /    \\  /\\  /  \\
   /    \\        \\   /      \\/  \\/    \\
  /      \\        \\ /        \\        \\
 /        \\        \\          \\        \\{/blue-fg}
{green-fg}     /\\  /\\  /\\      /\\  /\\  /\\      /\\  /\\
    /||{/green-fg}{green-fg}\\/||{/green-fg}{green-fg}\\/||\\    /||{/green-fg}{green-fg}\\/||{/green-fg}{green-fg}\\/||\\    /||{/green-fg}{green-fg}\\/||\\{/green-fg}
{green-fg}    /||  ||  ||\\  /||  ||  ||\\  /||  ||\\{/green-fg}
{green-fg}     |   ||   |    |   ||   |    |   ||{/green-fg}
{green-fg}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{/green-fg}`,

  'The Dalles': `
{yellow-fg}  |            |                       |           |
  |  ___       |                       |      ___  |
  | |   |      |                       |     |   | |
  | |   |      |  {/yellow-fg}{blue-fg}   ~ ~  ~~ ~  ~ ~{/blue-fg}{yellow-fg}   |     |   | |
  | |   |      | {/yellow-fg}{blue-fg} ~  ><>  ~~ <>< ~ ~{/blue-fg}{yellow-fg}  |     |   | |
  |  \\  |      |{/yellow-fg}{blue-fg}  ~~~ ~~ rapids ~~ ~~{/blue-fg}{yellow-fg} |     |  /  |
  |   \\ |      |{/yellow-fg}{blue-fg} ~ ~~ ><> ~ ~~ <><~ ~{/blue-fg}{yellow-fg}|     | /   |
  |    \\|______|{/yellow-fg}{blue-fg}~ ~~ ~~~ ~ ~~~ ~ ~~ ~{/blue-fg}{yellow-fg}|_____|/    |
  |            {/yellow-fg}{blue-fg} ~~~~~ ~ ~~~ ~ ~~~~~ ~ ~{/blue-fg}{yellow-fg}            |{/yellow-fg}
{yellow-fg}  |____________{/yellow-fg}{blue-fg}~~~~~~~~~~~~~~~~~~~~~~~~~{/blue-fg}{yellow-fg}____________|{/yellow-fg}
{blue-fg}  ~~~~~~~ ~ ~ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~ ~ ~~~~~{/blue-fg}
{green-fg}      ~~ riverbank ~~~  ~~~  ~~~  ~~~ riverbank ~~{/green-fg}`,

  'Fort Kearney': `
{yellow-fg}                    ___|  |___
                   |  {/yellow-fg}{red-fg}|~~|{/red-fg}{yellow-fg}   |
                   |  {/yellow-fg}{white-fg}| /|{/white-fg}{yellow-fg}   |
         __________|__|  |__|__________
        |  _    _     {bold}FORT{/bold}     _    _  |
        | |_|  |_|  {bold}KEARNEY{/bold}  |_|  |_| |
  ______|                            |______
 |  ||  [====]    ___    ___    [====]  ||  |
 |  ||  [====]   |   |  |   |  [====]  ||  |
 |__||__|____|___|___|__|___|___|____|__||__|{/yellow-fg}
{green-fg}  ~~ prairie ~~~ prairie ~~~ prairie ~~~ prairie ~~{/green-fg}`,

  'Fort Laramie': `
{yellow-fg}                         |
                        {/yellow-fg}{red-fg}|~~|{/red-fg}{yellow-fg}
                        {/yellow-fg}{white-fg}| /|{/white-fg}{yellow-fg}
         ________________|__|_________________
        |      _____    {bold}FORT{/bold}     _____       |
        |     | ~~~ |  {bold}LARAMIE{/bold}  | ~~~ |      |
        |     |_____|           |_____|      |
  ______|_  __    ___    [==]    ___    __  _|______
 | ||    | |  |  |   |  [==]  |   |  |  | |    || |
 |_||____|_|__|__|___|__|____|_|___|__|__|_|____||_|{/yellow-fg}
{green-fg}  ~~~ sage ~~~ brush ~~~ sage ~~~ brush ~~~ sage ~~~{/green-fg}`,

  'Fort Bridger': `
{yellow-fg}          |
         {/yellow-fg}{red-fg}|~~|{/red-fg}
{yellow-fg}         {/yellow-fg}{white-fg}| /|{/white-fg}
{yellow-fg}    _____|__|________    ____________
   /  {bold}FORT BRIDGER{/bold}    \\  / Trading     \\
  / ___   ___   ___  \\/ ___   ___   \\
 / |   | |   | |   | /\\ |   | |   |  \\
/  | o | | o | | o |/  \\| o | | o |   \\
|__|___|_|___|_|___|____|___|_|___|____|{/yellow-fg}
{green-fg}  ~~~~ trail ~~~~ creek ~~~~ trail ~~~~ brush ~~{/green-fg}`,

  'Fort Hall': `
{yellow-fg}              ___
             |   |
             | {/yellow-fg}{red-fg}|~~|{/red-fg}{yellow-fg}
             | {/yellow-fg}{white-fg}|/||{/white-fg}{yellow-fg}
         ____|___|____________________
        |        {bold}FORT HALL{/bold}            |
        |   ___       ___       ___  |
  ______|  |   | ___ |   | ___ |  | |______
 |  ||  |  | o ||   || o ||   || o| |  ||  |
 |__||__|__|___||___||___||___||___|_|__||__|{/yellow-fg}
{green-fg}  ~~~ grass ~~~ trail ~~~ grass ~~~ trail ~~~ grass{/green-fg}`,

  'Fort Boise': `
{yellow-fg}                    ___|  |___
                   |  {/yellow-fg}{red-fg}|~~|{/red-fg}{yellow-fg}   |
                   |  {/yellow-fg}{white-fg}| /|{/white-fg}{yellow-fg}   |
        ___________|__|  |__|___________
       |  ___    {bold}FORT BOISE{/bold}    ___    |
       | |   |              |   |   |
  _____|_|   |____  [==]  __|   |___|_____
 | ||  | |___|  | | [==] | |  |___| |  || |
 |_||__|________|_|______|_|________|__||_|{/yellow-fg}
{blue-fg}  ~~~~ ~ ~~~ ~ ~~~~~~~~ ~ ~~~~ ~ ~~~ ~ ~~~~~{/blue-fg}
{blue-fg}    ~ Boise River ~ ~ ~ ~ ~ Boise River ~ ~{/blue-fg}`,

  'Willamette Valley (Oregon City)': `
{yellow-fg}                      \\       |       /
                       \\      |      /
                        \\     |     /
                    . - ~ ~ ~ ~ ~ ~ ~ - .
                .  ~  {/yellow-fg}{bold}{yellow-fg}OREGON CITY{/yellow-fg}{/bold}{yellow-fg}   ~   .{/yellow-fg}
{yellow-fg}              ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~{/yellow-fg}
{white-fg}           ___  {/white-fg}{yellow-fg}~ ~ ~ ~{/yellow-fg}{white-fg}  ___    ___  {/white-fg}{yellow-fg}~ ~ ~{/yellow-fg}
{white-fg}          | Ch|  |  |  |Shop|  |Inn|   |  |{/white-fg}
{white-fg}      ____|___|__|__|__|____|__|___|___|__|______{/white-fg}
{green-fg}     ||||||||||||||||||||||||||||||||||||||||||||||||
    //// fields /// fields //// fields /// fields ////
   ||||||||||||||||||||||||||||||||||||||||||||||||||||
  //// wheat /// corn //// barley /// oats /// wheat //
 ||||||||||||||||||||||||||||||||||||||||||||||||||||||||{/green-fg}
{green-fg}  {bold}~ Welcome to Oregon! Your journey is complete! ~{/bold}{/green-fg}`,

  'Kansas River Crossing': `
{green-fg}  .,.,. grass .,.,.   .,.,.  grass  .,.,. grass .,.{/green-fg}
{green-fg} .,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,{/green-fg}
{blue-fg}  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~ ~ ~  ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~  ~ ~ ~ ~  ~ ~
  ~  ~ ~ ~  Kansas River  ~ ~  ~ ~ ~  ~ ~  ~ ~  ~ ~ ~
 ~ ~ ~  ~ ~ ~ ~ ~  ~ ~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~  ~ ~ ~
  ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~  ~ ~ ~ ~  ~ ~{/blue-fg}
{green-fg} .,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,{/green-fg}
{green-fg}  .,.,. grass .,.,.  .,.,. grass .,.,. grass .,.,. {/green-fg}
{green-fg}    ~~~ prairie ~~~  ~~ prairie ~~  ~~ prairie ~~~  {/green-fg}`,

  'Big Blue River Crossing': `
{green-fg}     /\\  /\\                              /\\  /\\
    /||{/green-fg}{green-fg}\\/||\\    {/green-fg}{green-fg}grass  .,.,.  grass   /||{/green-fg}{green-fg}\\/||\\{/green-fg}
{green-fg}     ||  ||   .,.,.,.,.,.,.,.,.,.,.,    ||  ||{/green-fg}
{blue-fg}  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~
  ~ ~ ~  ~ Big Blue River ~ ~ ~ ~  ~ ~ ~  ~ ~ ~  ~ ~
 ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~{/blue-fg}
{green-fg}  .,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,{/green-fg}
{green-fg}    /\\  /\\     grass .,.,. grass      /\\  /\\{/green-fg}
{green-fg}   /||{/green-fg}{green-fg}\\/||\\                           /||{/green-fg}{green-fg}\\/||\\{/green-fg}`,

  'Green River Crossing': `
{white-fg}   __/\\__         ___/\\___              __/\\____
  /      \\       /        \\            /        \\
 /  rock  \\     /   rock   \\          /  rock    \\{/white-fg}
{white-fg} \\        /     \\         /          \\         /{/white-fg}
{blue-fg}  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~ ~ ~ ~  Green River  ~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~  ~ ~ ~
  ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~  ~ ~ ~  ~ ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~{/blue-fg}
{white-fg}  \\__    __/    \\__     __/         \\__      __/{/white-fg}
{green-fg}    ~~~ scrub ~~~ rocky ~~~ scrub ~~~ rocky ~~~{/green-fg}`,

  'Snake River Crossing': `
{yellow-fg}  |\\                                           /|
  | \\          {bold}DANGER{/bold} - Snake River             / |
  |  \\                                       /  |
  |   \\                                     /   |
  |    \\___                           ___/     |{/yellow-fg}
{blue-fg}  ~ ~ ~ ~{/blue-fg}{yellow-fg}\\{/yellow-fg}{blue-fg} ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ {/blue-fg}{yellow-fg}/{/yellow-fg}{blue-fg}~ ~ ~ ~ ~
 ~><>~ ~ ~ ~ ~ ~ ><> ~ ~ ~ ><> ~ ~ ~ ~ ~ ~><>~ ~ ~
  ~ ~ ~ rapids ~ ~ ~ ~ rapids ~ ~ ~ rapids ~ ~ ~ ~
 ~ ><> ~ ~ ~ ><> ~ ~ ~ ><> ~ ~ ><> ~ ~ ><> ~ ~ ><>{/blue-fg}
{yellow-fg}  |    /                                   \\    |
  |___/ canyon walls     ~~~~      canyon  \\___|{/yellow-fg}
{green-fg}    ~~~ scrub ~~~ rocks ~~~ scrub ~~~ rocks ~~~{/green-fg}`,
};

module.exports = { landmarks };
