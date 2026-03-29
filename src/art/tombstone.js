function tombstone(name, epitaph, date) {
  var innerWidth = 17;
  var textWidth = innerWidth - 2;

  function center(text, w) {
    var t = text.length > w ? text.slice(0, w) : text;
    var pad = w - t.length;
    var left = Math.floor(pad / 2);
    var right = pad - left;
    return ' '.repeat(left) + t + ' '.repeat(right);
  }

  function wrapText(text, maxWidth) {
    if (text.length <= maxWidth) return [text];
    var words = text.split(' ');
    var lines = [];
    var current = '';
    for (var i = 0; i < words.length; i++) {
      if (current && (current + ' ' + words[i]).length > maxWidth) {
        lines.push(current);
        current = words[i];
      } else {
        current = current ? current + ' ' + words[i] : words[i];
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  var W = '{white-fg}';
  var WE = '{/white-fg}';
  var G = '{green-fg}';
  var GE = '{/green-fg}';
  var pipe = W + '|' + WE;
  var blank = '      ' + pipe + ' '.repeat(innerWidth) + pipe;

  var epitaphLines = wrapText(epitaph, textWidth);
  var epiRows = epitaphLines.map(function(line) {
    return '      ' + pipe + ' ' + center(line, textWidth) + ' ' + pipe;
  }).join('\n');

  return [
    '         ' + W + '_____________' + WE,
    '        ' + W + '/' + WE + '             ' + W + '\\' + WE,
    '       ' + W + '/' + WE + '    {bold}R.I.P.{/bold}     ' + W + '\\' + WE,
    blank,
    '      ' + pipe + ' ' + center(name, textWidth) + ' ' + pipe,
    blank,
    epiRows,
    blank,
    '      ' + pipe + ' ' + center(date, textWidth) + ' ' + pipe,
    blank,
    '      ' + W + '|' + '_'.repeat(innerWidth) + '|' + WE,
    '     ' + G + '/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\' + GE,
    '   ' + G + '~^~  ~^~  ~^~  ~^~  ~^~' + GE,
  ].join('\n');
}

var grave = [
  '      {white-fg}|{/white-fg}',
  '    {white-fg}--+--{/white-fg}',
  '      {white-fg}|{/white-fg}',
  '    {green-fg}/^^^\\{/green-fg}',
  '  {green-fg}~~~~~~~~~{/green-fg}',
].join('\n');

module.exports = { tombstone, grave };
