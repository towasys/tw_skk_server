import { db_get, db_to_read_get } from "./db";
import { decode, encode } from "./euc_jp";
import Path from "node:path";

Bun.listen({
	hostname: "localhost",
	port: 1178,
	socket: {
		async data(socket, data) {
			console.log(`${data} from ${socket.remoteAddress}`);
			if (data.toString() === "2") {
				socket.write("test/1  ");
				return;
			}
			if (data.toString()[0] === "1") {
				console.time();
				console.log([...data]);
				const points = [
					...(function* () {
						for (let i = 1; i < data.length - 1; i += 2) {
							yield (data[i] << 8) | data[i + 1];
						}
					})(),
				];
				console.log(points);
				const kana = decode(points);
				console.log(kana);
				const body_string = (await henkan(kana)).join("/");
				console.log({ body_string });
				const sample = encode(`1/${body_string}/\n`);
				console.log({ sample });
				socket.write(sample);
				console.timeEnd();
			}
		}, // message received from client
		open(socket) {
			console.log("open");
		}, // socket opened
		close(socket) {}, // socket closed
		drain(socket) {}, // socket ready for more data
		error(socket, error) {}, // error handler
	},
});

export async function henkan(kana: string) {
	const uri = Path.join(__dirname, "t_w-rinkaku.duckdb");
	console.log("get db");
	const db = await db_get(uri);
	if (!db) {
		throw "no db";
	}

	console.log("query");
	const result = await db.all(
		`
            WITH RECURSIVE
				given as (
					SELECT ? as text
				),
				sub_text as (
					SELECT
						given.text as left,
						'' as right,
						0 as index
					FROM given

					UNION

					SELECT
						LEFT(given.text, LENGTH(given.text) - (index + 1)) as left,
						RIGHT(given.text, index+1) as right,
						index + 1 as index
					FROM sub_text, given
					WHERE LENGTH(given.text)  - (index + 1) > 0
				),
				sub_text_limited as (
					SELECT * FROM sub_text WHERE index < 8
				),
				hoge as (
					SELECT
						 DISTINCT whole.title
					FROM Post as sub_kana_left, Post as sub_kanji_left, sub_text_limited, PostRelation, Post as whole
					WHERE true
						AND sub_kana_left.title = sub_text_limited.left
						AND sub_kana_left.kno = PostRelation.fg
						AND PostRelation.bg = sub_kanji_left.kno
						AND CONCAT(sub_kanji_left.title, sub_text_limited.right) = whole.title
					ORDER BY LENGTH(whole.title) ASC
				),
				hira_to_kata as MATERIALIZED (
					SELECT hira, kata
					FROM (
						SELECT 'あ' as hira, 'ア' as kata
						UNION SELECT 'い' as hira, 'イ' as kata
						UNION SELECT 'う' as hira, 'ウ' as kata
						UNION SELECT 'え' as hira, 'エ' as kata
						UNION SELECT 'お' as hira, 'オ' as kata
						UNION SELECT 'か' as hira, 'カ' as kata
						UNION SELECT 'き' as hira, 'キ' as kata
						UNION SELECT 'く' as hira, 'ク' as kata
						UNION SELECT 'け' as hira, 'ケ' as kata
						UNION SELECT 'こ' as hira, 'コ' as kata
						UNION SELECT 'さ' as hira, 'サ' as kata
						UNION SELECT 'し' as hira, 'シ' as kata
						UNION SELECT 'す' as hira, 'ス' as kata
						UNION SELECT 'せ' as hira, 'セ' as kata
						UNION SELECT 'そ' as hira, 'ソ' as kata
						UNION SELECT 'た' as hira, 'タ' as kata
						UNION SELECT 'ち' as hira, 'チ' as kata
						UNION SELECT 'つ' as hira, 'ツ' as kata
						UNION SELECT 'て' as hira, 'テ' as kata
						UNION SELECT 'と' as hira, 'ト' as kata
						UNION SELECT 'な' as hira, 'ナ' as kata
						UNION SELECT 'に' as hira, 'ニ' as kata
						UNION SELECT 'ぬ' as hira, 'ヌ' as kata
						UNION SELECT 'ね' as hira, 'ネ' as kata
						UNION SELECT 'の' as hira, 'ノ' as kata
						UNION SELECT 'は' as hira, 'ハ' as kata
						UNION SELECT 'ひ' as hira, 'ヒ' as kata
						UNION SELECT 'ふ' as hira, 'フ' as kata
						UNION SELECT 'へ' as hira, 'ヘ' as kata
						UNION SELECT 'ほ' as hira, 'ホ' as kata
						UNION SELECT 'ま' as hira, 'マ' as kata
						UNION SELECT 'み' as hira, 'ミ' as kata
						UNION SELECT 'む' as hira, 'ム' as kata
						UNION SELECT 'め' as hira, 'メ' as kata
						UNION SELECT 'も' as hira, 'モ' as kata
						UNION SELECT 'や' as hira, 'ヤ' as kata
						UNION SELECT 'ゆ' as hira, 'ユ' as kata
						UNION SELECT 'よ' as hira, 'ヨ' as kata
						UNION SELECT 'ら' as hira, 'ラ' as kata
						UNION SELECT 'り' as hira, 'リ' as kata
						UNION SELECT 'る' as hira, 'ル' as kata
						UNION SELECT 'れ' as hira, 'レ' as kata
						UNION SELECT 'ろ' as hira, 'ロ' as kata
						UNION SELECT 'わ' as hira, 'ワ' as kata
						UNION SELECT 'を' as hira, 'ヲ' as kata
						UNION SELECT 'ん' as hira, 'ン' as kata
						UNION SELECT 'ー' as hira, 'ー' as kata

						UNION SELECT 'が' as hira, 'ガ' as kata
						UNION SELECT 'ぎ' as hira, 'ギ' as kata
						UNION SELECT 'ぐ' as hira, 'グ' as kata
						UNION SELECT 'げ' as hira, 'ゲ' as kata
						UNION SELECT 'ご' as hira, 'ゴ' as kata

						UNION SELECT 'ざ' as hira, 'ザ' as kata
						UNION SELECT 'じ' as hira, 'ジ' as kata
						UNION SELECT 'ず' as hira, 'ズ' as kata
						UNION SELECT 'ぜ' as hira, 'ゼ' as kata
						UNION SELECT 'ぞ' as hira, 'ゾ' as kata

						UNION SELECT 'だ' as hira, 'ダ' as kata
						UNION SELECT 'ぢ' as hira, 'ヂ' as kata
						UNION SELECT 'づ' as hira, 'ヅ' as kata
						UNION SELECT 'で' as hira, 'デ' as kata
						UNION SELECT 'ど' as hira, 'ド' as kata

						UNION SELECT 'ば' as hira, 'バ' as kata
						UNION SELECT 'び' as hira, 'ビ' as kata
						UNION SELECT 'ぶ' as hira, 'ブ' as kata
						UNION SELECT 'べ' as hira, 'ベ' as kata
						UNION SELECT 'ぼ' as hira, 'ボ' as kata

						UNION SELECT 'ぱ' as hira, 'パ' as kata
						UNION SELECT 'ぴ' as hira, 'ピ' as kata
						UNION SELECT 'ぷ' as hira, 'プ' as kata
						UNION SELECT 'ぺ' as hira, 'ペ' as kata
						UNION SELECT 'ぽ' as hira, 'ポ' as kata

						UNION SELECT 'ぁ' as hira, 'ァ' as kata
						UNION SELECT 'ぃ' as hira, 'ィ' as kata
						UNION SELECT 'ぅ' as hira, 'ゥ' as kata
						UNION SELECT 'ぇ' as hira, 'ェ' as kata
						UNION SELECT 'ぉ' as hira, 'ォ' as kata

						UNION SELECT 'っ' as hira, 'ッ' as kata
						
						UNION SELECT 'ゃ' as hira, 'ャ' as kata
						UNION SELECT 'ゅ' as hira, 'ュ' as kata
						UNION SELECT 'ょ' as hira, 'ョ' as kata
					)
				),
				kata as (
					SELECT
						'' as kata,
						0 as index
					FROM given

					UNION

					SELECT
						CONCAT(kata.kata, hira_to_kata.kata) as kata,
						kata.index + 1 as index
					FROM given, kata, hira_to_kata
					WHERE true
						AND given.text[kata.index + 1] = hira_to_kata.hira
				)
            
            SELECT * FROM hoge
			UNION
			SELECT kata as title
			FROM kata, given, Post
			WHERE true
				AND kata.index = LENGTH(given.text)
				AND kata.kata = Post.title
	    `,
		`${kana}`,
	);

	console.log(result);
	return result.map((post) => post.title);
}

console.log("Listening port is 1178");
