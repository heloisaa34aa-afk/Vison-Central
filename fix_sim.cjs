const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenSimulator.tsx', 'utf8');

const anchor = 'isWebPlayer={false}\n                          />\n                        );\n                      })()}\n                    </div>';

const startIdx = code.indexOf(anchor);

if (startIdx !== -1) {
    const textAfter = code.slice(startIdx + anchor.length);
    
    // find where the old block ends, which is just before `                  </div>`
    // wait, we can just look for the NEXT `                    </div>`
    const nextDiv1 = code.indexOf('                    </div>', startIdx + anchor.length);
    if (nextDiv1 !== -1) {
        // we delete from startIdx + anchor.length up to nextDiv1 + '                    </div>'.length
        code = code.slice(0, startIdx + anchor.length) + code.slice(nextDiv1 + 26);
        fs.writeFileSync('src/components/ScreenSimulator.tsx', code);
        console.log("Fixed ScreenSimulator.tsx successfully");
    }
}
