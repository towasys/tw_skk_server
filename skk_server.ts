import { db_get } from "./db";
import { decode, encode } from "./euc_jp";

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

async function henkan(kana: string) {
	const uri = "t_w-rinkaku.duckdb";
	console.log("get db");
	const db = await db_get(uri);
	if (!db) {
		throw "no db";
	}

	console.log("query");
	const result = await db.all(
		`
            WITH kana_posts as (SELECT * FROM Post WHERE title LIKE ? ORDER BY LENGTH(title) ASC LIMIT 30)
            
            SELECT Post.title
            FROM Post, kana_posts, PostRelation
            WHERE
                (PostRelation.fg = kana_posts.kno)
                AND PostRelation.bg = Post.kno
                AND Post.title != ''
                AND Post.title != 'あれ'
                AND length(kana_posts.title) >= length(Post.title)
            ORDER BY LENGTH(Post.title) ASC
            LIMIT 1000;
	    `,
		`${kana}%`,
	);

	console.log(result);
	return result.map((post) => post.title);
}

console.log("Listening port is 1178");
