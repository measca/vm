var lexer = require("./src/core/lexer");
var parser = require("./src/core/parser");

// var template = `
//     <img
//         cv="haha+{c}"
//         src={path}
//         class={{show: isShow, "index-top": top > 20 || bottom < 0 && left == 0, "pull-left": !!inLeft}}
//         alt={title | toLow('a', val, 'v' | toLow) | to}
//         index={i + 5 * (20 - 1) / 9}
//         index-t={i+=5}>sdsdcc&#123; f</img>
// `;

var template = `
    {if a,b c d}<div></div>{/if}
`;

var lexer_data = lexer(template);
lexer_data = parser(lexer_data);
console.log(JSON.stringify(lexer_data));