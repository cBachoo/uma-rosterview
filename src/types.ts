interface SupportCardData {
  exp: number;
  limit_break_count: number;
  position: number;
  support_card_id: number;
}

interface SkillData {
  level: number;
  skill_id: number;
}

interface CharaBaseData {
  card_id: number;
  factor_id_array: number[];
  talent_level: number;
}

interface SuccessionCharaData extends CharaBaseData {
  position_id: number;
  win_saddle_id_array?: number[];
}

interface CharaData extends CharaBaseData {
  create_time: string;
  rarity: number;
  chara_seed: number;
  rank_score?: number;

  speed: number;
  stamina: number;
  power: number;
  guts: number;
  wiz: number;

  proper_distance_short: number;
  proper_distance_mile: number;
  proper_distance_middle: number;
  proper_distance_long: number;
  proper_ground_dirt: number;
  proper_ground_turf: number;
  proper_running_style_nige: number;
  proper_running_style_oikomi: number;
  proper_running_style_sashi: number;
  proper_running_style_senko: number;

  factor_id_array: number[];
  skill_array: SkillData[];
  succession_chara_array: SuccessionCharaData[];
  support_card_list: SupportCardData[];
  win_saddle_id_array?: number[];
}

export type { CharaData, SkillData, SuccessionCharaData };
