const fs = require('fs');
const file = 'vision-central-web/src/services/supabase/tvs.ts';
let data = fs.readFileSync(file, 'utf8');

// In mapDbToTv
data = data.replace(
  "texto_inferior_visivel: db.texto_inferior_visivel || false,",
  "texto_inferior_visivel: db.texto_inferior_visivel || false,\n    config_revision: db.config_revision || 0,"
);

// In mapTvToDb
data = data.replace(
  "texto_inferior_visivel: tv.texto_inferior_visivel !== undefined ? tv.texto_inferior_visivel : false,",
  "texto_inferior_visivel: tv.texto_inferior_visivel !== undefined ? tv.texto_inferior_visivel : false,\n    config_revision: tv.config_revision || 0,"
);

// In updateTvField, to increment config_revision
data = data.replace(
  "const updateData: any = {",
  "// Se for alteracao visual, incrementar a versao\n      let increment = 1;\n      if (['nome', 'playlistId'].includes(field)) increment = 0;\n      const updateData: any = {"
);

data = data.replace(
  "const { error } = await supabase",
  "if (increment > 0) {\n        // Busca a revisao atual e incrementa\n        const { data: revData } = await supabase.from('tvs').select('config_revision').eq('id', id).maybeSingle();\n        const currentRev = revData?.config_revision || 0;\n        updateData.config_revision = currentRev + 1;\n      }\n      const { error } = await supabase"
);

fs.writeFileSync(file, data);
