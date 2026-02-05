<script lang="ts">
    import type { CharaData } from "../types";
    import { charaCardsData } from "../data";
    import { getIconCardId } from "../iconMapping";
    import Stats from "./Stats.svelte";
    import SuccessionChara from "./SuccessionChara.svelte";
    import FactorList from "./FactorList.svelte";
    import Apttitudes from "./Apttitudes.svelte";

    interface Props {
        charaData: CharaData;
        display: {
            stats: boolean;
            factors: boolean;
        };
        filters: {
            blues: { [key: string]: boolean | number; stars: number };
            reds: { [key: string]: boolean | number; stars: number };
            greens: { stars: number };
            whites: { [key: string]: boolean | number; stars: number };
        };
    }
    const { charaData, display, filters }: Props = $props();

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
        // Map global cardId to Japanese icon cardId if needed
        const iconCardId = getIconCardId(charaCard.id);
        const paddedIconCardId = String(iconCardId).padStart(6, "0");
        // Determine suffix based on talent_level (02 if >= 3, otherwise 01)
        const suffix = charaData.talent_level >= 3 ? "02" : "01";

        return `/chara/uma/chr_icon_${charaId}_${paddedIconCardId}_${suffix}.webp`;
    });

    const charaDatetime = $derived(charaData.create_time.split(" "));

    // Map rank_score to badge image number
    function getRankBadgeNumber(score: number | undefined): string {
        if (score === undefined) return "00";

        const thresholds = [
            { max: 300, badge: "00" }, // G
            { max: 600, badge: "01" }, // G+
            { max: 900, badge: "02" }, // F
            { max: 1300, badge: "03" }, // F+
            { max: 1800, badge: "04" }, // E
            { max: 2300, badge: "05" }, // E+
            { max: 2900, badge: "06" }, // D
            { max: 3500, badge: "07" }, // D+
            { max: 4900, badge: "08" }, // C
            { max: 6500, badge: "09" }, // C+
            { max: 8200, badge: "10" }, // B
            { max: 10000, badge: "11" }, // B+
            { max: 12100, badge: "12" }, // A
            { max: 14500, badge: "13" }, // A+
            { max: 15900, badge: "14" }, // S
            { max: 17500, badge: "15" }, // S+
            { max: 19200, badge: "16" }, // SS
            { max: 19600, badge: "17" }, // SS+
            { max: 20000, badge: "18" }, // UG
            { max: 20400, badge: "19" }, // UG1
            { max: 20800, badge: "20" }, // UG2
            { max: 21200, badge: "21" }, // UG3
            { max: 21600, badge: "22" }, // UG4
            { max: 22100, badge: "23" }, // UG5
            { max: 22500, badge: "24" }, // UG6
            { max: 23000, badge: "25" }, // UG7
            { max: 23400, badge: "26" }, // UG8
            { max: 23900, badge: "27" }, // UG9
            { max: 24300, badge: "28" }, // UF
            { max: 24800, badge: "29" }, // UF1
            { max: 25300, badge: "30" }, // UF2
            { max: 25800, badge: "31" }, // UF3
            { max: 26300, badge: "32" }, // UF4
            { max: 26800, badge: "33" }, // UF5
            { max: 27300, badge: "34" }, // UF6
            { max: 27800, badge: "35" }, // UF7
            { max: Infinity, badge: "35" }, // UF7
        ];

        for (const { max, badge } of thresholds) {
            if (score <= max) {
                return badge;
            }
        }
        return "35"; // Default to highest rank
    }

    const rankBadgeNumber = $derived(getRankBadgeNumber(charaData.rank_score));
    const rankBadgeUrl = $derived(
        `/rank/utx_ico_statusrank_${rankBadgeNumber}.png`,
    );
</script>

<div class="card h-100">
    <!-- Character Header -->
    <div class="chara-header card-header">
        <div class="d-flex align-items-center">
            <div class="d-flex align-items-center" style="gap: 8px;">
                <img
                    src={charaThumb}
                    alt={charaCardLabel}
                    class="card-header-img"
                />
                {#if charaData.rank_score !== undefined}
                    <img
                        src={rankBadgeUrl}
                        alt="Rank Badge"
                        class="rank-badge"
                        title={`Rank Score: ${charaData.rank_score}`}
                    />
                {/if}
            </div>
            <div class="flex-grow-1">
                <p class="card-title fs-5">{charaCardLabel}</p>
            </div>
            <div
                class="font-monospace text-end d-flex flex-column"
                style="font-size: 14px;"
            >
                {#if charaData.rank_score !== undefined}
                    <div style="font-weight: 600;">
                        rank score: {charaData.rank_score}
                    </div>
                {/if}
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
                    {#if display.factors}
                        <hr />
                    {/if}
                {/if}
                {#if display.factors}
                    <div class="mb-2">
                        <small class="text-muted">Current Unit Sparks:</small>
                        <FactorList
                            factorIds={charaData.factor_id_array}
                            {filters}
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
                                {filters}
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
                                {filters}
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
    .rank-badge {
        height: 32px;
        width: auto;
    }
</style>
