import pg from 'pg';
const {Pool}=pg;

// This is ONLY a salted scrypt hash. The plaintext password is not stored in source.
const INITIAL_ADMIN_HASH='scrypt$b4cb10d1488f1b95c71526c505488fc9$dfe6022a5a29cb7bb5182f24fcd513346c34f964c470627ac7d29be618d3e3bf68e769c9aed12af471d77b7ca360a4fd78484c041bb1a7085d820070c55b1a42';

function pool(){
  const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
  if(!url)throw new Error('DATABASE_URL (or POSTGRES_URL) is not configured. Add a PostgreSQL/Neon database connection string in Vercel Environment Variables.');
  const local=/localhost|127\.0\.0\.1/.test(url);
  return new Pool({connectionString:url,ssl:local?false:{rejectUnauthorized:false},max:1,idleTimeoutMillis:5000,connectionTimeoutMillis:8000});
}

export async function ensureAuthSchema(){
  const db=pool();
  try{
    await db.query(`
      CREATE TABLE IF NOT EXISTS image_reshaper_users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(80) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'user',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(
      `INSERT INTO image_reshaper_users (username,password_hash,role,active)
       VALUES ($1,$2,'admin',TRUE)
       ON CONFLICT (username) DO NOTHING`,
      ['admin',INITIAL_ADMIN_HASH]
    );
  }finally{await db.end().catch(()=>{});}
}

export async function findUser(username){
  await ensureAuthSchema();
  const db=pool();
  try{
    const {rows}=await db.query(
      `SELECT id,username,password_hash,role,active FROM image_reshaper_users WHERE lower(username)=lower($1) LIMIT 1`,
      [String(username||'').trim()]
    );
    return rows[0]||null;
  }finally{await db.end().catch(()=>{});}
}
