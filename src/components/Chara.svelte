<script lang="ts">
    import type { CharaData } from "../types";
    import { charaCardsData } from "../data";
    import Stats from "./Stats.svelte";
    import SuccessionChara from "./SuccessionChara.svelte";
    import SkillList from "./SkillList.svelte";
    import FactorList from "./FactorList.svelte";
    import Apttitudes from "./Apttitudes.svelte";

    interface Props {
        charaData: CharaData;
        display: {
            stats: boolean;
            factors: boolean;
        };
    }
    const { charaData, display }: Props = $props();

    const charaCard = $derived(charaCardsData[charaData.card_id]);
    const charaCardLabel = $derived(
        charaCard?.name.replace("] ", "]\n") ||
            `Unknown Chara (${charaData.card_id})`,
    );

    const charaCreateTimeLabel = $derived(
        new Date(charaData.create_time).toLocaleString(),
    );
    const charaThumb = $derived.by(() => {
        if (!charaCard) return "";

        const charaId = charaCard.chara_id;
        const dressId =
            charaCard.race_dress[charaData.rarity - 1] ||
            charaCard.race_dress[0];
        const paddedDressId = String(dressId).padStart(6, "0");
        // Determine suffix based on talent_level (02 if >= 3, otherwise 01)
        const suffix = charaData.talent_level >= 3 ? "02" : "01";

        return `/chara/chr${charaId}/trained_chr_icon_${charaId}_${paddedDressId}_${suffix}.png`;
    });

    const charaDatetime = $derived(charaData.create_time.split(" "));
</script>

<div class="card h-100">
    <!-- Character Header -->
    <div class="chara-header card-header">
        <div class="d-flex align-items-center">
            <img
                src={charaThumb}
                alt={charaCardLabel}
                class="card-header-img"
            />
            <div class="flex-grow-1">
                <p class="card-title fs-5">{charaCardLabel}</p>
            </div>
            <div
                class="font-monospace text-end d-flex flex-column"
                style="font-size: 14px;"
            >
                <div>{charaDatetime[0]}</div>
                <div>{charaDatetime[1]}</div>
            </div>
        </div>
        <!-- <ul class="nav nav-tabs card-header-tabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button
                    class="nav-link active"
                    id={`main-tab-${charaData.chara_seed}`}
                    data-bs-toggle="tab"
                    data-bs-target={`#main-tab-pane-${charaData.chara_seed}`}
                    type="button"
                    role="tab"
                    aria-controls={`main-tab-pane-${charaData.chara_seed}`}
                    aria-selected="true"
                >
                    Main
                </button>
            </li>
            <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id={`successors-tab-${charaData.chara_seed}`}
          data-bs-toggle="tab"
          data-bs-target={`#successors-tab-pane-${charaData.chara_seed}`}
          type="button"
          role="tab"
          aria-controls={`successors-tab-pane-${charaData.chara_seed}`}
          aria-selected="false"
        >
          Successors
        </button>
      </li>
        </ul> -->
    </div>

    <div class="card-body">
        <div class="tab-content">
            <div
                class="tab-pane fade show active"
                id={`main-tab-pane-${charaData.chara_seed}`}
                role="tabpanel"
                aria-labelledby={`main-tab-${charaData.chara_seed}`}
                tabindex="0"
            >
                {#if display.stats}
                    <Stats
                        speed={charaData.speed}
                        stamina={charaData.stamina}
                        power={charaData.power}
                        guts={charaData.guts}
                        wiz={charaData.wiz}
                    ></Stats>
                    <Apttitudes {charaData}></Apttitudes>
                    <hr />
                    <SkillList skillList={charaData.skill_array}></SkillList>
                    {#if display.factors}
                        <hr />
                    {/if}
                {/if}
                {#if display.factors}
                    <div class="mb-2">
                        <small class="text-muted">Current Unit Sparks:</small>
                        <FactorList factorIds={charaData.factor_id_array}
                        ></FactorList>
                    </div>
                    <hr />
                    {#each charaData.succession_chara_array.slice(0, 2) as successionChara, index}
                        <div class="mb-2">
                            <small class="text-muted"
                                >Parent {index + 1} Sparks:</small
                            >
                            <FactorList
                                factorIds={successionChara.factor_id_array}
                            ></FactorList>
                        </div>
                        {#if index < charaData.succession_chara_array.slice(0, 2).length - 1}
                            <hr />
                        {/if}
                    {/each}
                {/if}
            </div>
            <div
                class="tab-pane fade"
                id={`successors-tab-pane-${charaData.chara_seed}`}
                role="tabpanel"
                aria-labelledby={`successors-tab-${charaData.chara_seed}`}
                tabindex="0"
            >
                <!-- Successor Factors Section -->
                <div class="mb-2">
                    <div
                        class="accordion accordion-flush"
                        id={`${charaData.chara_seed}`}
                    >
                        {#each charaData.succession_chara_array as successionChara}
                            <SuccessionChara
                                successionCharaData={successionChara}
                                trainedCharaID={charaData.chara_seed}
                            ></SuccessionChara>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .chara-header {
        white-space: pre;
    }
    .card-header-img {
        height: 68px;
        width: 64px;
    }
</style>
