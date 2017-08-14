var o2str = ({}).toString;

var ignoredRef = /\((\?\!|\?\:|\?\=)/g;


exports.escapeRegExp = function (str) {// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
    return str.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function (match) {
        return '\\' + match;
    });
};

exports.typeOf = function (o) {
    return o == null ? String(o) : o2str.call(o).slice(8, -1).toLowerCase();
}

exports.findSubCapture = function (regStr) {
    var left = 0,
        right = 0,
        len = regStr.length,
        ignored = regStr.match(ignoredRef); // ignored uncapture
    if (ignored) 
        ignored = ignored.length
    else ignored = 0;
    for (; len--;) {
        var letter = regStr.charAt(len);
        if (len === 0 || regStr.charAt(len - 1) !== "\\") {
            if (letter === "(") left++;
            if (letter === ")") right++;
        }
    }
    if (left !== right) throw "RegExp: " + regStr + "'s bracket is not marched";
    else return left - ignored;
};

exports.trackErrorPos = (function () {
    // linebreak
    var lb = /\r\n|[\n\r\u2028\u2029]/g;
    var minRange = 20, maxRange = 20;
    function findLine(lines, pos) {
        var tmpLen = 0;
        for (var i = 0, len = lines.length; i < len; i++) {
            var lineLen = (lines[i] || "").length;

            if (tmpLen + lineLen > pos) {
                return { num: i, line: lines[i], start: pos - i - tmpLen, prev: lines[i - 1], next: lines[i + 1] };
            }
            // 1 is for the linebreak
            tmpLen = tmpLen + lineLen;
        }
    }
    function formatLine(str, start, num, target) {
        var len = str.length;
        var min = start - minRange;
        if (min < 0) min = 0;
        var max = start + maxRange;
        if (max > len) max = len;

        var remain = str.slice(min, max);
        var prefix = "[" + (num + 1) + "] " + (min > 0 ? ".." : "")
        var postfix = max < len ? ".." : "";
        var res = prefix + remain + postfix;
        if (target) res += "\n" + new Array(start - min + prefix.length + 1).join(" ") + "^^^";
        return res;
    }
    return function (input, pos) {
        if (pos > input.length - 1) pos = input.length - 1;
        lb.lastIndex = 0;
        var lines = input.split(lb);
        var line = findLine(lines, pos);
        var start = line.start, num = line.num;

        return (line.prev ? formatLine(line.prev, start, num - 1) + '\n' : '') +
            formatLine(line.line, start, num, true) + '\n' +
            (line.next ? formatLine(line.next, start, num + 1) + '\n' : '');

    }
})();

exports.pushArrayAtIndex = function(arr, data, index) {
    var tempArr = [];
    if(arr.length == 0) {
        tempArr.push(data);
        return tempArr;
    }
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if(i == index) {
            tempArr.push(data);
        }
        tempArr.push(item);
    }
    return tempArr;
}