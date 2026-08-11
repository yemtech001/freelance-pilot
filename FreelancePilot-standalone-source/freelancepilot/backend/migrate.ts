import 'dotenv/config';
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Pool} from 'pg';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:undefined});
async function main(){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');const dir=path.resolve(__dirname,'../migrations');const files=(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort();for(const filename of files){const exists=await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1',[filename]);if(exists.rowCount)continue;const sql=await readFile(path.join(dir,filename),'utf8');const client=await pool.connect();try{await client.query('BEGIN');await client.query(sql);await client.query('INSERT INTO schema_migrations(filename) VALUES($1)',[filename]);await client.query('COMMIT');console.log(`Applied ${filename}`)}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}}
main().then(()=>pool.end()).catch(e=>{console.error(e);pool.end().finally(()=>process.exit(1))});