const { createFileAdapter } = require('./file');
const { createSupabaseJsonAdapter } = require('./supabase-json');
const { createSupabaseTablesAdapter } = require('./supabase-tables');

function createStorageAdapter(options = {}) {
  const { mode } = options;
  if (mode === 'supabaseTables') {
    return createSupabaseTablesAdapter(options.supabaseTables || {});
  }
  if (mode === 'supabaseJson') {
    return createSupabaseJsonAdapter(options.supabaseJson || {});
  }
  return createFileAdapter(options.file || {});
}

module.exports = { createStorageAdapter };
