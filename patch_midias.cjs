const fs = require('fs');

let code = fs.readFileSync('src/services/supabase/midias.ts', 'utf8');

const mapDbToMidiaStr = `export function mapDbToMidia(db: any): Midia {
  let url = db.origem === 'url' ? (db.url_externa || '') : (db.url_storage || '');
  let metadata;
  
  if (db.origem === 'url' && url.startsWith('{')) {
     try {
       const parsed = JSON.parse(url);
       url = parsed.url;
       metadata = parsed;
     } catch (e) {}
  }
  
  return {
    id: db.id,
    nome: db.nome || '',
    url,
    origem: db.origem || 'storage',
    url_storage: db.url_storage || null,
    url_externa: db.url_externa || null,
    tipo: (db.tipo || 'image') as any,
    duracao: db.duracao !== undefined ? Number(db.duracao) : 10,
    tamanho: db.tamanho || undefined,
    clienteId: db.cliente_id || undefined,
    metadata
  };
}`;

const mapMidiaToDbStr = `export function mapMidiaToDb(midia: Midia): any {
  let url_externa = midia.origem === 'url' ? (midia.url_externa || midia.url) : null;
  
  if (midia.metadata && Object.keys(midia.metadata).length > 0) {
      url_externa = JSON.stringify({ ...midia.metadata, url: midia.url });
  }

  return {
    id: midia.id,
    nome: midia.nome,
    tipo: midia.tipo,
    origem: midia.origem || 'storage',
    url_storage: midia.origem === 'url' ? null : (midia.url_storage || midia.url),
    url_externa,
    duracao: midia.duracao,
    tamanho: midia.tamanho || null,
    cliente_id: midia.clienteId || null
  };
}`;

code = code.replace(/export function mapDbToMidia[\s\S]+?return {[\s\S]+?};?\n}/, mapDbToMidiaStr);
code = code.replace(/export function mapMidiaToDb[\s\S]+?return {[\s\S]+?};?\n}/, mapMidiaToDbStr);

fs.writeFileSync('src/services/supabase/midias.ts', code);
