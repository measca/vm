var util = require("../common/util");

function Parser(input) {
    this.input = input;
    // 轮训下标
    this.__index = 0;
    // 循环到的目标。
    this.item = input[0];
}

Parser.prototype.getNextItem = function(i) {
    i = i === undefined || i === null ? 1 : i;
    this.__index += i;
    return (this.item = this.input[this.__index]);
}

Parser.prototype.__next = function() {
    switch (this.item['type']) {
        case "TAG_OPEN":
            // 通过读取下标
            return this.__TagOpen();
            break;
        case "EXPR_OPEN":
            return this.__Experssion();
            break;
        case "{":
            return this["{}"]();
            break;
        case "(":
            return this["()"]();
            break;
        case "OPEN":
            return this.__Open();
            break;
        default:
            return this.__Ident();
            break;
    }
}

Parser.prototype.generate = function() {
    var datas = [];
    while (this.item["type"] != "EOF") {
        var nextData = this.__next();
        if(nextData instanceof Array) {
            datas = datas.concat(nextData);
        } else {
            datas.push(nextData);
        }
    }
    return datas;
}

Parser.prototype.__TagOpen = function() {
    var tag = {
        type: "TAG",
        name: this.item.value,
        attribute: {},
        body: []
    };
    this.getNextItem();
    // 获取 TAG 的属性
    while(this.item.type != ">") {
        if(this.item.type === "/" && this.input[this.__index + 1].type === ">") {
            this.getNextItem(2);
            return tag;
        }
        var itemVal = this.item.value;
        if(this.item.type === "NAME") {
            tag.attribute[itemVal] = undefined;
            if(this.input[this.__index + 1]["type"] == "=") {
                this.getNextItem(2);
                tag.attribute[itemVal] = this.__next();
            }
        }
    }
    this.getNextItem();
    var bodyData = [];

    // 设置 Body 的内容
    // 问题 例如像 <input> 这类的无关闭标签怎么处理，（需要知道当前标签的父标签，当逐个读取的时候读到有关父标签的关闭的时候就表示当前标签无关闭标签）
    while (this.item) {
        if(this.item.type == "TAG_CLOSE" && this.item.value != tag.name || this.item.type == "EOF") {
            // 如果能进入这里就表示当前标签为 自关闭标签；
            return util.pushArrayAtIndex(bodyData, tag, 0);
        }
        if(this.item.type == "TAG_CLOSE" && this.item.value == tag.name) break;
        var nextData = this.__next();
        if(nextData instanceof Array) {
            bodyData = bodyData.concat(nextData);
        } else {
            bodyData.push(nextData);
        }
    }
    this.getNextItem();
    tag.body = bodyData;
    return tag;
}

Parser.prototype.__Experssion = function() {
    var experssion = {
        type: "EXPRESSION",
        value: []
    };
    this.getNextItem();
    while (this.item["type"] != "END") {
        experssion.value.push(this.__next());
    }
    this.getNextItem();
    return experssion;
}

Parser.prototype["{}"] = function() {
    var data = {
        type: "{}",
        value: {}
    };
    this.getNextItem();
    while (this.item["type"] != "}") {
        if(this.item["type"] == ",") {
            this.getNextItem();
        }
        if(this.item["type"] != "IDENT") continue;

        var val = this.item.value;
        if(this.input[this.__index + 1]["type"] == ":") {
            this.getNextItem(2);
        }
        data.value[val] = this.__next();
    }
    this.getNextItem();
    return data;
}

Parser.prototype["()"] = function() {
    var data = {
        type: "()",
        value: []
    };
    this.getNextItem();
    while (this.item["type"] != ")") {
        data.value.push(this.__next());
    }
    this.getNextItem();
    return data;
}

Parser.prototype.__Open = function() {
    var open = {
        type: "EXPRESSION_TAG",
        name: this.item.value,
        parameter: [],
        body: []
    };
    this.getNextItem();
    // 获取 parameter
    var parameterArr;
    while (this.item["type"] != "END") {
        if((this.input[this.__index + 1]["type"] == "," || this.input[this.__index + 1]["type"] == "END") && this.item["type"] == ",") {
            this.getNextItem();
            continue;
        }
        if(this.item["type"] == ",") {
            this.getNextItem();
        } else {
            parameterArr = [];
            open.parameter.push(parameterArr);
        }
        parameterArr.push(this.__next());
    }
    this.getNextItem();
    // 获取 body
    while (this.item["type"] != "CLOSE") {
        open.body.push(this.__next());
    }
    this.getNextItem();
    return open;
}

Parser.prototype.__Ident = function() {
    var item = this.item;
    var returnVal;
    if(item["type"] == "[") {
        // 这里处理数组
        returnVal = {
            type: "[]",
            value: [],
            filter: []
        };
        this.getNextItem();
        while (this.item["type"] != "]") {
            if(this.item["type"] == "," && this.getNextItem()) continue;
            returnVal.value.push(this.__next());
        }
    } else if(item["type"] != "IDENT") {
        returnVal = {
            type: this.item["type"],
            value: this.item.value,
            filter: []
        };
        this.getNextItem();
    }

    // 判断是否是 function 和 filter 还有 v.f
    // 先判断 function
    if(!returnVal && this.input[this.__index + 1]["type"] == "(" && this.getNextItem(2)) {
        returnVal = {
            type: "FUNCTION",
            value: item.value,
            parameter: [],
            filter: []
        };
        while(this.item["type"] != ")") {
            if(this.item["type"] == "," && this.getNextItem()) continue;
            returnVal.parameter.push(this.__next());
        }
        this.getNextItem();
    } else if(!returnVal){
        returnVal = {
            type: "VARIABLE",
            value: item.value,
            filter: []
        };
        if(this.input[this.__index + 1]["type"] == ".") {
            this.getNextItem(2);
            do {
                returnVal.value += "." + this.item["value"];
            } while (this.input[this.__index + 1]["type"] == "." && this.getNextItem())
        }
        this.getNextItem();
    }

    // 处理 [] 类型的数据
    var tempData = returnVal;
    while (this.item["type"] == "[") {
        if(!tempData["[]"]) {
            tempData["[]"] = {
                value: []
            };
        }
        while (this.item["type"] != "]" && this.getNextItem()) {
            tempData["[]"].value.push(this.__next());
        }
        tempData = tempData["[]"];
        this.getNextItem();
    }

    // 下面处理 filter
    if(this.item["type"] != "|") return returnVal;
    do {
        this.getNextItem();
        var filterVal = {
            name: this.item.value,
            parameter: []
        };
        if(this.input[this.__index + 1]["type"] == "(") {
            this.getNextItem(2);
            while (this.item["type"] != ")") {
                if(this.item["type"] == "," && this.getNextItem()) continue;
                filterVal.parameter.push(this.__next());
            }
        }
        returnVal.filter.push(filterVal);
    } while(this.input[this.__index + 1]["type"] == "|" && this.getNextItem())
    this.getNextItem();
    return returnVal;
}

module.exports = function(input) {
    return new Parser(input).generate();
}