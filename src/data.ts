import factorData from "./assets/factor.json";
import charaCardDataRaw from "./assets/TerumiCharacterData_FixedDuplicates.json";
import skillData from "./assets/skill.json";

interface Factor {
	id: number;
	name: string;
	type: number;
	rarity: number;
}

interface TerumiCharaCard {
	cardId: number;
	charaId: number;
	charaName: string;
	cardTitle: string;
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

const transformCharaCard = (raw: TerumiCharaCard): CharaCard => ({
	id: raw.cardId,
	chara_id: raw.charaId,
	name: `${raw.cardTitle} ${raw.charaName}`,
	race_dress: Array(5).fill(raw.cardId),
});

const factorsData = createLookup((factorData as any).value as Factor[]);
const charaCardsData = createLookup(
	(charaCardDataRaw.value as TerumiCharaCard[]).map(transformCharaCard)
);
const skillsData = createLookup(skillData as Skill[]);

export { factorsData, charaCardsData, skillsData };
export type { Factor, CharaCard, Skill };
