// Must be the first import: configures env before back/mod.ts boots.
Deno.env.set("TYPE_GENERATION", "false");
Deno.env.set("PLAYGROUND", "false");
Deno.env.set("SERVER_PORT", "14098");
// Isolated database so the test never touches dev data.
Deno.env.set("DB_NAME", "nejat_report_scope_test");
