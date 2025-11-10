import factorData from "./assets/factor.json";
import characardData from "./assets/characard.json";
import skillData from "./assets/skill.json";

interface Factor {
	id: number;
	name: string;
	type: number;
	rarity: number;
}

interface CharaCard {
	id: number;
	chara_id: number;
	name: string;
	race_dress: number[];
}

interface Skill {
	id: number;
	name: string;
	rarity: number;
	icon_id: number;
}

const createLookup = <T extends { id: number }>(data: T[]) =>
	Object.fromEntries(data.map((item) => [item.id, item]));

const factorsData = createLookup(factorData as Factor[]);
const charaCardsData = createLookup(characardData as CharaCard[]);
const skillsData = createLookup(skillData as Skill[]);

export { factorsData, charaCardsData, skillsData };
export type { Factor, CharaCard, Skill };
