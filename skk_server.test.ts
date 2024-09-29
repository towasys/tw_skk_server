import { test, expect } from "bun:test";
import { henkan } from "./skk_server";

test.each([
	"よくする",
	"よく",
	"こーど",
	"そーすこーど",
	"ああああああああああああああああああああああ",
])("test", async (a) => {
	const h = await henkan(a);
});
