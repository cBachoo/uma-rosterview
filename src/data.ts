import factorData from "./assets/TerumiFactorData.json";
import charaCardDataRaw from "./assets/TerumiCharacterData.json";
import skillDataRaw from "./assets/TerumiSimpleSkillData.json";

interface Factor {
  id: number;
  name: string;
  type: number;
  rarity: number;
}

interface Skill {
  skillId: number;
  skillName: string;
  rarity: number;
  skillCategory: string;
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

const createLookup = <T extends { id: number }>(data: T[]) =>
  Object.fromEntries(data.map((item) => [item.id, item]));

const transformCharaCard = (raw: TerumiCharaCard): CharaCard => ({
  id: raw.cardId,
  chara_id: raw.charaId,
  name: `${raw.cardTitle} ${raw.charaName}`,
  race_dress: Array(5).fill(raw.cardId),
});

const factorsData = createLookup(factorData as unknown as Factor[]);
const charaCardsData = createLookup(
  (charaCardDataRaw as unknown as TerumiCharaCard[]).map(transformCharaCard),
);

const transformSkill = (raw: any): Skill => ({
  skillId: raw.skillId,
  skillName: raw.skillName,
  rarity: raw.rarity,
  skillCategory: raw.skillCategory,
});

const skillsData = Object.fromEntries(
  (skillDataRaw as unknown as any[]).map((skill) => {
    const transformed = transformSkill(skill);
    return [transformed.skillId, transformed];
  }),
);

export { factorsData, charaCardsData, skillsData };
export type { Factor, CharaCard, Skill };
