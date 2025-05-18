import { lesan, MongoClient, redis } from "@deps";
import {
	axeses,
	cities,
	files,
	police_stations,
	provinces,
	users,
} from "@model";
import { functionsSetup } from "./src/mod.ts";

export const myRedis = await redis.connect({
	hostname: "127.0.0.1",
	port: 6379,
});

export const coreApp = lesan();
const client = await new MongoClient("mongodb://127.0.0.1:27017/").connect();
const db = client.db("nejat");
coreApp.odm.setDb(db);

export const user = users();
export const file = files();
export const province = provinces();
export const city = cities();
export const axes = axeses();
// export const accident = accidents();
export const police_station = police_stations();

export const { setAct, setService, getAtcsWithServices } = coreApp.acts;

export const { selectStruct, getSchemas } = coreApp.schemas;

functionsSetup();

coreApp.runServer({
	port: 1404,
	typeGeneration: true,
	playground: true,
	staticPath: ["/uploads"],
	cors: [
		"http://localhost:3000",
		"http://localhost:4000",
	],
});
