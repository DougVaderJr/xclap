"use strict";

const xclap = require("../../..");
const sample1 = require("../../fixtures/sample1");
const expect = require("chai").expect;
const xstdout = require("xstdout");
const chalk = require("chalk");

describe("sample1 console report", function() {
  before(() => (chalk.enabled = false));
  after(() => (chalk.enabled = true));

  it("should log report to console", done => {
    const expectOutput = `NOTE: finally hook is unreliable when stopOnError is set to full
Process x1/x1foo serial array ["?woofoo",["foo2","foo4"]]
Optional Task woofoo not found
-Process x1/x1foo.S concurrent array ["foo2","foo4"]
..Process /foo2 serial array ["foo2a"]
--Process foo4's dependency serial array ["foo4Dep"]
...Process /foo2a serial array ["xfoo1","xfoo2","~$echo test anon shell",[".","a","b"],"func","foo3",["a","b",["a","c"],"xfoo4","b","xfoo4","func"],"xfoo4"]
---Execute /foo4Dep as function
....Execute /xfoo1 as function
>>>Done Execute /foo4Dep as function
>>Done Process foo4's dependency serial array ["foo4Dep"]
--Execute /foo4 as function
>>Done Execute /foo4 as function
..Execute /foo4:finally as function
>>Done Execute /foo4:finally as function
>>>>Done Execute /xfoo1 as function
----Execute /xfoo2 echo "a direct shell command xfoo2"
>>>>Done Execute /xfoo2 echo "a direct shell command xfoo2"
....Execute echo test anon shell
>>>>Done Execute echo test anon shell
----Process /foo2a.S serial array [".","a","b"]
.....Execute /a as function
>>>>>Done Execute /a as function
-----Execute /b as function
>>>>>Done Execute /b as function
>>>>Done Process /foo2a.S serial array [".","a","b"]
....Execute /foo2a.S anonymous function
>>>>Done Execute /foo2a.S anonymous function
----Process foo3's dependency serial array ["foo3Dep"]
.....Execute /foo3Dep as function
>>>>>Done Execute /foo3Dep as function
>>>>Done Process foo3's dependency serial array ["foo3Dep"]
----Execute /foo3 as function
>>>>Done Execute /foo3 as function
....Process /foo2a.S concurrent array ["a","b",["a","c"],"xfoo4","b","xfoo4","func"]
-----Execute /a as function
.....Execute /b as function
-----Process /foo2a.S.C concurrent array ["a","c"]
.....Execute /xfoo4 as function
-----Execute /b as function
.....Execute /xfoo4 as function
-----Execute /foo2a.S.C anonymous function
......Execute /a as function
------Execute /c as function
>>>>>Done Execute /foo2a.S.C anonymous function
>>>>>Done Execute /xfoo4 as function
>>>>>Done Execute /xfoo4 as function
>>>>>Done Execute /a as function
>>>>>Done Execute /b as function
>>>>>Done Execute /b as function
>>>>>>Done Execute /a as function
>>>>>>Done Execute /c as function
>>>>>Done Process /foo2a.S.C concurrent array ["a","c"]
>>>>Done Process /foo2a.S concurrent array ["a","b",["a","c"],"xfoo4","b","xfoo4","func"]
....Execute /xfoo4 as function
>>>>Done Execute /xfoo4 as function
>>>Done Process /foo2a serial array ["xfoo1","xfoo2","~$echo test anon shell",[".","a","b"],"func","foo3",["a","b",["a","c"],"xfoo4","b","xfoo4","func"],"xfoo4"]
>>Done Process /foo2 serial array ["foo2a"]
>Done Process x1/x1foo.S concurrent array ["foo2","foo4"]
Done Process x1/x1foo serial array ["?woofoo",["foo2","foo4"]]
`;
    const intercept = xstdout.intercept(true);
    xclap.load(sample1);
    xclap.load("x1", {
      x1foo: ["?woofoo", ["foo2", "foo4"]]
    });
    xclap.run("x1foo", err => {
      intercept.restore();
      if (err) {
        return done(err);
      }
      const output = intercept.stdout
        .filter(x => x.match(/^\[/))
        .map(x => x.replace(/ \([0-9\.]+ ms\)/, ""))
        .map(x => x.replace(/^\[[^\]]+\] /, ""))
        .join("");
      expect(output).to.equal(expectOutput);
      done();
    });
  });

  it("should log failure report to console", done => {
    const expectOutput = `Process /foo2ba serial array ["xfoo1","xfoo2","~$echo test anon shell",[".","a","b"],"func","foo3",["a","b",["a","c"],"xerr","b","xerr","func"],"xfoo4"]
-Execute /xfoo1 as function
>Done Execute /xfoo1 as function
.Execute /xfoo2 echo "a direct shell command xfoo2"
>Done Execute /xfoo2 echo "a direct shell command xfoo2"
-Execute echo test anon shell
>Done Execute echo test anon shell
.Process /foo2ba.S serial array [".","a","b"]
--Execute /a as function
>>Done Execute /a as function
..Execute /b as function
>>Done Execute /b as function
>Done Process /foo2ba.S serial array [".","a","b"]
-Execute /foo2ba.S anonymous function
>Done Execute /foo2ba.S anonymous function
.Process foo3's dependency serial array ["foo3Dep"]
--Execute /foo3Dep as function
>>Done Execute /foo3Dep as function
>Done Process foo3's dependency serial array ["foo3Dep"]
.Execute /foo3 as function
>Done Execute /foo3 as function
-Process /foo2ba.S concurrent array ["a","b",["a","c"],"xerr","b","xerr","func"]
..Execute /a as function
--Execute /b as function
..Process /foo2ba.S.C concurrent array ["a","c"]
--Execute /xerr as function
..Execute /b as function
--Execute /xerr as function
..Execute /foo2ba.S.C anonymous function
---Execute /a as function
...Execute /c as function
>>Failed Execute /xerr as function
>>Failed Execute /xerr as function
>>Done Execute /foo2ba.S.C anonymous function
>>Done Execute /a as function
>>Done Execute /b as function
>>Done Execute /b as function
>>>Done Execute /a as function
>>>Done Execute /c as function
>>Done Process /foo2ba.S.C concurrent array ["a","c"]
>Done Process /foo2ba.S concurrent array ["a","b",["a","c"],"xerr","b","xerr","func"]
Done Process /foo2ba serial array ["xfoo1","xfoo2","~$echo test anon shell",[".","a","b"],"func","foo3",["a","b",["a","c"],"xerr","b","xerr","func"],"xfoo4"]
`;
    let error;
    let intercept = xstdout.intercept(true);
    xclap.load(sample1);
    xclap.run("foo2ba", err => {
      error = err;
    });

    xclap.once("spawn-async", () =>
      xclap.waitAllPending(() => {
        intercept.restore();
        expect(error).to.exist;
        expect(error.length).to.equal(2);
        expect(error[0].message).to.equal("xerr");
        expect(error[1].message).to.equal("xerr");
        const output = intercept.stdout
          .filter(x => x.match(/^\[/))
          .map(x => x.replace(/ \([0-9\.]+ ms\)/, ""))
          .map(x => x.replace(/^\[[^\]]+\] /, ""))
          .join("");
        expect(output).to.equal(expectOutput);
        done();
      })
    );
  });
});
