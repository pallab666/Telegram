const fs = require('fs');
let c = fs.readFileSync('src/components/InitialSetupModal.tsx', 'utf8');

c = c.replace(/<Globe className="w-5 h-5" \/>/g, '<Globe className="w-5 h-5" />\n            </div>');
c = c.replace(/<\/h3>/g, '</h3>\n            </div>\n          </div>');
c = c.replace(/<Check className="w-2.5 h-2.5 stroke-\[3\]" \/>/g, '<Check className="w-2.5 h-2.5 stroke-[3]" />\n                        </div>');
c = c.replace(/<div className="text-sm font-bold">\{lang.nativeName\}/g, '<div className="text-sm font-bold">{lang.nativeName}</div>');
c = c.replace(/<div className="text-\[10px\] text-slate-500">\{lang.name\}/g, '<div className="text-[10px] text-slate-500">{lang.name}</div>\n                      </div>\n                    </div>');
c = c.replace(/<span>\{cur.code\}<\/span>/g, '<span>{cur.code}</span>\n                        </div>');
c = c.replace(/cur.nameEn.split\(' '\)\[0\]\}/g, 'cur.nameEn.split(\' \')[0]}\n                        </div>\n                      </div>\n                    </div>');
c = c.replace(/<\/span>\n            <ArrowRight/g, '</span>\n            <ArrowRight'); // Wait, let's fix carefully

fs.writeFileSync('src/components/InitialSetupModal.tsx', c);
