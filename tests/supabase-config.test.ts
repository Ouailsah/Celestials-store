import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('shared server configuration reads runtime credentials and keeps checkout credentials separate', () => {
  const result = spawnSync(process.execPath, ['--conditions=react-server', '--import=tsx', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { supabaseConfig } from './src/lib/supabase-config.ts';
    for (const key of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']) delete process.env[key];
    assert.equal(supabaseConfig().configured, false);
    process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
    assert.equal(supabaseConfig().configured, false);
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='public-test-key';
    assert.equal(supabaseConfig().configured, true);
    assert.equal(supabaseConfig().serviceRoleKey, '');
    process.env.SUPABASE_SERVICE_ROLE_KEY='server-test-key';
    assert.equal(supabaseConfig().serviceRoleKey, 'server-test-key');
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='   ';
    assert.equal(supabaseConfig().configured, false);
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=' another-public-key ';
    assert.equal(supabaseConfig().anonKey, 'another-public-key');
  `], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
