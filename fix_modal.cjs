const fs = require('fs');
let code = fs.readFileSync('src/components/AddMediaModal.tsx', 'utf8');

// Replace MEDIA_TYPES
code = code.replace(/const MEDIA_TYPES = \[\s*\{[\s\S]+?\];/, `const MEDIA_TYPES = [
  { id: 'image', label: 'Imagem', icon: ImageIcon },
  { id: 'video', label: 'Vídeo', icon: Video },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'website', label: 'Website/URL', icon: Globe },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
];`);

// Remove specific states
code = code.replace(/  \/\/ Specific fields[\s\S]+?const handleSubmit =/g, '  const handleSubmit =');

// Update handleSubmit
code = code.replace(/    if \(tipo === 'youtube'\) \{[\s\S]+?\} else if \(tipo === 'website' \|\| tipo === 'instagram' \|\| tipo === 'canva' \|\| tipo === 'powerbi' \|\| tipo === 'looker' \|\| tipo === 'pdf'\) \{/g, `    if (tipo === 'website' || tipo === 'instagram' || tipo === 'pdf') {`);

// Update the dynamic fields section completely
const dynamicFieldsMatch = code.match(/              \{\/\* Dynamic Fields \*\/\}[\s\S]+?\{\/\* Tempo de Exibição/);
if (dynamicFieldsMatch) {
  code = code.replace(dynamicFieldsMatch[0], `              {/* Dynamic Fields */}
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

              {/* Tempo de Exibição`);
}

// Remove {tipo !== 'weather' && ( and its closing brace around Tempo de Exibição
code = code.replace(/              \{tipo !== 'weather' && \([\s\S]+?<div className="space-y-1">/, `              <div className="space-y-1">`);
code = code.replace(/              \)\}\s*<\/form>/, `              </form>`);

fs.writeFileSync('src/components/AddMediaModal.tsx', code);
