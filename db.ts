import * as duckdb from "duckdb-async";
import { Err, Ok } from "ts-results-es";

export async function db_create_table(db: duckdb.Database) {
  await db.run(`CREATE TABLE IF NOT EXISTS Post (
    kno string PRIMARY KEY,
    title string NOT NULL,
    body_text_content string NOT NULL,
    body_html string NOT NULL,
    posted_at timestamp NOT NULL,
    crawled_at timestamp NOT NULL,
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS PostRelation (
    fgbg string PRIMARY KEY,
    fg string NOT NULL,
    bg string NOT NULL,
  )`);
}

export async function db_query(uri: string, query: string, ...args: any) {
  try {
    db = await db_get(uri);
    return Ok(await db.all(query, ...args));
  } catch (error) {
    return Err(error);
  }
}

export let db: duckdb.Database | null = null;
export async function db_get(uri: string) {
  if (!db) {
    db = await duckdb.Database.create(uri);
  }

  return db;
}
