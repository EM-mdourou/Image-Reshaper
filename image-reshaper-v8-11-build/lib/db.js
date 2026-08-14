import pg from 'pg';
const {Pool}=pg;

// This is ONLY a salted scrypt hash. The plaintext password is not stored in source.
const INITIAL_ADMIN_HASH='scrypt$b4cb10d1488f1b95c71526c505488fc9$dfe6022a5a29cb7bb5182f24fcd513346c34f964c470627ac7d29be618d3e3bf68e769c9aed12af471d77b7ca360a4fd78484c041bb1a7085d820070c55b1a42';


const SEEDED_USERS=[
  ['scraper','scrypt$e61cab98f8ae28e895c45660ac0834cb$fac510e3427993a09eec93f3b6d5b174b75acc88b0b039e9dadf37b864ce7c34723544f7e92602c834e4f0293c0d3062a775bbda4e00c90cda13f624db3171c5','user'],
  ['mdourou','scrypt$530f1dd3cefeb07401b023a48a774e58$22a036ad261aae150a2d64a1f0364f8d446409e6563b5df5c566f496589201686f43c351fe88db60a9c1a644b2835e1d5276e2ab570c1d149df2687bec271b6c','user']
];

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
    for(const [username,passwordHash,role] of SEEDED_USERS){
      await db.query(
        `INSERT INTO image_reshaper_users (username,password_hash,role,active)
         VALUES ($1,$2,$3,TRUE)
         ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, active=TRUE, updated_at=NOW()`,
        [username,passwordHash,role]
      );
    }
    await db.query(`
      CREATE TABLE IF NOT EXISTS image_reshaper_history (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT,
        username VARCHAR(80) NOT NULL,
        action VARCHAR(40) NOT NULL,
        destination_name VARCHAR(120),
        width INTEGER,
        height INTEGER,
        instructions TEXT,
        source_filename TEXT,
        thumbnail_data_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
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


export async function addHistoryEntry(entry){
  await ensureAuthSchema();
  const db=pool();
  try{
    const {rows}=await db.query(
      `INSERT INTO image_reshaper_history
       (user_id,username,action,destination_name,width,height,instructions,source_filename,thumbnail_data_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,created_at`,
      [entry.userId||null,entry.username||'user',entry.action||'GENERATE',entry.destinationName||'',entry.width||null,entry.height||null,entry.instructions||'',entry.sourceFilename||'',entry.thumbnailDataUrl||null]
    );
    return rows[0];
  }finally{await db.end().catch(()=>{});}
}

export async function listHistoryEntries(limit=200){
  await ensureAuthSchema();
  const db=pool();
  try{
    const safe=Math.max(1,Math.min(500,Number(limit)||200));
    const {rows}=await db.query(
      `SELECT id,username,action,destination_name,width,height,instructions,source_filename,thumbnail_data_url,created_at
       FROM image_reshaper_history ORDER BY created_at DESC LIMIT $1`,[safe]
    );
    return rows;
  }finally{await db.end().catch(()=>{});}
}
