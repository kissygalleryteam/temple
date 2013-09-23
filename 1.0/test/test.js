var assert = require("assert")

var interp = require("../lib/interp")

describe("simple",function(){
  it("string",function(){
    assert.equal(interp("ab"),"ab");
  });

  it("string substitute",function(){
    assert.equal(interp("hi:{name}",{name:"tom"}),"hi:tom");
  });
});
