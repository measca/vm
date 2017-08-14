import lexer from "../src/core/lexer";

describe("测试 lexer", () => {
    it("解析 html标签", () => {
        var template = "<div></div>";
        var lexer_data = lexer(template);
        assert.equal(lexer_data.length, 4, "解析出来的长度正确");
    });
});