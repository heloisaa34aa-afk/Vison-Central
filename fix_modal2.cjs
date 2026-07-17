const fs = require('fs');
let code = fs.readFileSync('src/components/AddMediaModal.tsx', 'utf8');

// The dynamic fields block
code = code.replace(/              \{\/\* Dynamic Fields \*\/\}[\s\S]+?              <div className="space-y-1">/g, `              {/* Dynamic Fields */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {tipo === 'instagram' ? 'URL do Perfil ou Post' :
                   tipo === 'pdf' ? 'URL do PDF Público' :
                   tipo === 'image' || tipo === 'video' ? 'URL Pública do Arquivo' :
                   'URL do Website'}
                </label>
                <input 
                  type="url" 
                  required
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">`);

fs.writeFileSync('src/components/AddMediaModal.tsx', code);
