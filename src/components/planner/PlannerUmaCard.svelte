<script lang="ts">
    import type { CharaData } from "../../types";
    import { charaCardsData } from "../../data";
    import { getIconCardId } from "../../utils/iconMapping";
    import SparkEditorModal from "./SparkEditorModal.svelte";
    import WhiteSparkSelector from "./WhiteSparkSelector.svelte";
    import { racesByRaceId } from "../../utils/races";
    import { getSparkChance } from "../../utils/inspiration";
    import { calculateAptitudeRaises, characterAptitudesByCardId, numToGrade, sparkStatToAptKey } from "../../utils/characters";

    interface SparkData {
        stat: string;
        level: number;
        isRace?: boolean;
    }

    interface UmaWithSparks extends CharaData {
        blueSpark?: SparkData;
        pinkSpark?: SparkData;
        greenSpark?: SparkData;
        whiteSpark?: SparkData[];
        races?: string[];
    }

    interface Props {
        uma: UmaWithSparks | null;
        label: string;
        size: "lg" | "md" | "sm" | "xs";
        borderColor: string;
        onSelect: () => void;
        onClear?: () => void;
        affinityValue?: number;
        sparkProcs?: Record<string, { chanceAtLeastOnce: number; type: string }>;
        onOpenSparkProcs?: () => void;
        onBlueSparkChange?: (spark: SparkData) => void;
        onPinkSparkChange?: (spark: SparkData) => void;
        onGreenSparkChange?: (spark: SparkData) => void;
        onWhiteSparkChange?: (sparks: SparkData[]) => void;
        onRacesChange?: (races: string[]) => void;
        // Pink sparks from ancestors (GPs for parents, GGPs for GPs) for aptitude raise display
        ancestorPinkSparks?: Array<{ stat: string; level: number } | undefined | null>;
    }

    const { uma, label, size, borderColor, onSelect, onClear, affinityValue, sparkProcs, onOpenSparkProcs, onBlueSparkChange, onPinkSparkChange, onGreenSparkChange, onWhiteSparkChange, onRacesChange, ancestorPinkSparks }: Props = $props();

    // Modal state
    type ModalType = 'blue' | 'pink' | 'green' | 'race' | 'white' | null;
    let activeModal = $state<ModalType>(null);

    // Get all G1 races for race selector
    // race_id < 2000 = G1, 2000-2999 = G2, 3000+ = G3 and below
    const allRaces = Array.from(racesByRaceId.values())
        .filter(race => race.race_id < 2000)
        .sort((a, b) => a.race_name.localeCompare(b.race_name))
        .map(race => race.race_name);

    // Calculate inheritance chances for each spark type
    const blueChance = $derived(() => {
        if (!uma?.blueSpark || !affinityValue) return 0;
        return getSparkChance(uma.blueSpark, affinityValue, 'blueSpark');
    });

    const pinkChance = $derived(() => {
        if (!uma?.pinkSpark || !affinityValue) return 0;
        return getSparkChance(uma.pinkSpark, affinityValue, 'pinkSpark');
    });

    const greenChance = $derived(() => {
        if (!uma?.greenSpark || !affinityValue) return 0;
        return getSparkChance(uma.greenSpark, affinityValue, 'greenSpark');
    });

    // Calculate aptitude raises from ancestor pink sparks (GPs → parent, GGPs → GP)
    const aptitudeRaises = $derived(() => {
        if (!uma?.card_id || !ancestorPinkSparks?.length) return [];
        return calculateAptitudeRaises(uma.card_id, ancestorPinkSparks);
    });

    // Build aptitude display grid with raise highlights
    const aptitudeGrid = $derived(() => {
        if (!uma?.card_id) return null;
        const apts = characterAptitudesByCardId.get(uma.card_id);
        if (!apts) return null;

        const raisedMap: Record<string, string> = {};
        for (const raise of aptitudeRaises()) {
            const key = sparkStatToAptKey[raise.stat];
            if (key) raisedMap[key] = raise.raisedGrade;
        }

        const chip = (baseVal: number, key: string) => {
            const baseGrade = numToGrade[baseVal] || 'G';
            const raisedGrade = raisedMap[key];
            return { displayGrade: raisedGrade ?? baseGrade, raised: !!raisedGrade };
        };

        return {
            turf:        chip(apts.turf,        'turf'),
            dirt:        chip(apts.dirt,        'dirt'),
            sprint:      chip(apts.sprint,      'sprint'),
            mile:        chip(apts.mile,        'mile'),
            medium:      chip(apts.medium,      'medium'),
            long:        chip(apts.long,        'long'),
            frontRunner: chip(apts.frontRunner, 'frontRunner'),
            paceChaser:  chip(apts.paceChaser,  'paceChaser'),
            lateSurger:  chip(apts.lateSurger,  'lateSurger'),
            endCloser:   chip(apts.endCloser,   'endCloser'),
        };
    });

    function getAptClass(grade: string): string {
        if (grade === 'A' || grade === 'S') return 'apt-high';
        if (grade === 'B' || grade === 'C') return 'apt-mid';
        return 'apt-low';
    }

    // Get top spark procs sorted by chance
    const topSparkProcs = $derived(() => {
        if (!sparkProcs) return [];
        return Object.entries(sparkProcs)
            .sort(([, a], [, b]) => b.chanceAtLeastOnce - a.chanceAtLeastOnce)
            .slice(0, 5);
    });

    const sizeClasses = {
        lg: { card: "uma-card-lg", img: 72, text: "" },
        md: { card: "uma-card-md", img: 64, text: "" },
        sm: { card: "uma-card-sm", img: 48, text: "small" },
        xs: { card: "uma-card-xs", img: 40, text: "small" }
    };

    function getCharaName(cardId: number): { title: string; name: string } {
        const card = charaCardsData[cardId];
        if (!card) return { title: "", name: "Unknown" };

        // card.name format is "[Title] Character Name"
        const fullName = card.name;
        const titleMatch = fullName.match(/^\[(.+?)\]\s*(.+)$/);

        if (titleMatch) {
            return { title: `[${titleMatch[1]}]`, name: titleMatch[2] };
        }

        // Fallback if no title found
        return { title: "", name: fullName };
    }

    function getCharaImageUrl(cardId: number, talentLevel: number = 0): string {
        if (!cardId) return "";
        const card = charaCardsData[cardId];
        if (!card) return "";

        const charaId = card.chara_id;
        const iconCardId = getIconCardId(card.id);
        const paddedIconCardId = String(iconCardId).padStart(6, "0");
        const suffix = talentLevel >= 3 ? "02" : "01";

        return `/chara/uma/chr_icon_${charaId}_${paddedIconCardId}_${suffix}.webp`;
    }

    const config = sizeClasses[size];

    // Get affinity icon based on value (matching example folder implementation)
    function getAffinityIcon(affinity: number): { symbol: string; color: string } {
        if (affinity < 51) {
            return { symbol: "▲", color: "text-danger" }; // Triangle (red)
        } else if (affinity < 151) {
            return { symbol: "●", color: "text-warning" }; // Circle (yellow)
        } else {
            return { symbol: "◉", color: "text-success" }; // Double circle (green)
        }
    }
</script>

{#if uma}
    <div
        class="card {config.card} border-3 shadow-sm h-100 uma-card-clickable"
        style="border-color: {borderColor};"
    >
        <div class="card-body {size === 'lg' || size === 'md' ? 'p-3' : 'p-2'}">
            <!-- Header -->
            <div class="d-flex align-items-start justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width: 0;" role="button" onclick={onSelect}>
                    <img
                        src={getCharaImageUrl(uma.card_id, uma.talent_level)}
                        alt={getCharaName(uma.card_id).name}
                        class="rounded-circle flex-shrink-0"
                        style="width: {config.img}px; height: {config.img}px; object-fit: cover; cursor: pointer;"
                    />
                    <div class="flex-grow-1" style="min-width: 0;">
                        {#if uma.card_id}
                            {@const nameData = getCharaName(uma.card_id)}
                            {#if nameData.title}
                                <div class="small text-muted">{nameData.title}</div>
                            {/if}
                            <div class="fw-bold {config.text}">{nameData.name}</div>
                        {/if}
                    </div>
                </div>
                {#if onClear}
                    <button
                        class="btn btn-sm btn-link text-danger p-0 ms-1 flex-shrink-0 clear-btn"
                        type="button"
                        onclick={(e) => {
                            e.stopPropagation();
                            onClear();
                        }}
                    >
                        ×
                    </button>
                {/if}
            </div>

            <!-- Affinity Badge -->
            {#if affinityValue !== undefined && affinityValue > 0}
                {@const icon = getAffinityIcon(affinityValue)}
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-muted small text-uppercase">Affinity</span>
                    <div class="d-flex align-items-center gap-1">
                        <span class="fw-bold">{affinityValue}</span>
                        <span class="{icon.color}" style="font-size: 0.875rem;">{icon.symbol}</span>
                    </div>
                </div>
            {/if}

            <!-- Affinity for p0 (Target) -->
            {#if label === "Target" && affinityValue !== undefined}
                {@const icon = getAffinityIcon(affinityValue)}
                <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <small class="text-muted text-uppercase fw-bold">Affinity</small>
                    <div class="d-flex align-items-center gap-1">
                        <span class="fw-bold">{affinityValue}</span>
                        <span class="{icon.color}" style="font-size: 0.875rem;">{icon.symbol}</span>
                    </div>
                </div>
            {/if}

            <!-- Aptitude Grid — all cards except GGPs (xs), raises highlighted in gold -->
            {#if size !== 'xs'}
                {@const grid = aptitudeGrid()}
                {#if grid}
                    <div class="apt-section mb-2 pb-2 border-bottom">
                        <div class="apt-group-row">
                            <span class="apt-group-lbl">Surf</span>
                            <div class="apt-chips-row">
                                <div class="apt-chip {getAptClass(grid.turf.displayGrade)} {grid.turf.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Turf</span>
                                    <span class="apt-grade">{grid.turf.displayGrade}</span>
                                </div>
                                <div class="apt-chip {getAptClass(grid.dirt.displayGrade)} {grid.dirt.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Dirt</span>
                                    <span class="apt-grade">{grid.dirt.displayGrade}</span>
                                </div>
                                <div class="apt-chip-empty"></div>
                                <div class="apt-chip-empty"></div>
                            </div>
                        </div>
                        <div class="apt-group-row">
                            <span class="apt-group-lbl">Dist</span>
                            <div class="apt-chips-row">
                                <div class="apt-chip {getAptClass(grid.sprint.displayGrade)} {grid.sprint.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Sprint</span>
                                    <span class="apt-grade">{grid.sprint.displayGrade}</span>
                                </div>
                                <div class="apt-chip {getAptClass(grid.mile.displayGrade)} {grid.mile.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Mile</span>
                                    <span class="apt-grade">{grid.mile.displayGrade}</span>
                                </div>
                                <div class="apt-chip {getAptClass(grid.medium.displayGrade)} {grid.medium.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Med</span>
                                    <span class="apt-grade">{grid.medium.displayGrade}</span>
                                </div>
                                <div class="apt-chip {getAptClass(grid.long.displayGrade)} {grid.long.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Long</span>
                                    <span class="apt-grade">{grid.long.displayGrade}</span>
                                </div>
                            </div>
                        </div>
                        <div class="apt-group-row">
                            <span class="apt-group-lbl">Style</span>
                            <div class="apt-chips-row">
                                <div class="apt-chip {getAptClass(grid.frontRunner.displayGrade)} {grid.frontRunner.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Front</span>
                                    <span class="apt-grade">{grid.frontRunner.displayGrade}</span>
                                </div>
                                <div class="apt-chip {getAptClass(grid.paceChaser.displayGrade)} {grid.paceChaser.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Pace</span>
                                    <span class="apt-grade">{grid.paceChaser.displayGrade}</span>
                                </div>
                                <div class="apt-chip {getAptClass(grid.lateSurger.displayGrade)} {grid.lateSurger.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">Late</span>
                                    <span class="apt-grade">{grid.lateSurger.displayGrade}</span>
                                </div>
                                <div class="apt-chip {getAptClass(grid.endCloser.displayGrade)} {grid.endCloser.raised ? 'apt-raised' : ''}">
                                    <span class="apt-lbl">End</span>
                                    <span class="apt-grade">{grid.endCloser.displayGrade}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}

            <!-- Spark Procs for p0 (Target) -->
            {#if label === "Target" && sparkProcs && topSparkProcs().length > 0}
                <div class="spark-display">
                    <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                        <small class="text-muted text-uppercase fw-bold">Inspiration Chance</small>
                        <button
                            class="btn btn-link btn-sm p-0 text-decoration-none"
                            onclick={(e) => {
                                e.stopPropagation();
                                if (onOpenSparkProcs) onOpenSparkProcs();
                            }}
                        >
                            <small>View All →</small>
                        </button>
                    </div>
                    {#each topSparkProcs() as [stat, proc]}
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <small class="text-truncate me-2" style="max-width: 70%;">{stat}</small>
                            <small class="fw-bold">{proc.chanceAtLeastOnce.toFixed(1)}%</small>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Spark Selectors for parents/grandparents (lg/md/sm) -->
            {#if label !== "Target" && (size === 'lg' || size === 'md' || size === 'sm')}
                <div class="spark-selectors d-grid gap-1">
                    <!-- Blue Spark Button -->
                    <button
                        class="btn btn-sm btn-outline-primary text-start px-2 py-1 w-100 d-flex justify-content-between align-items-center"
                        type="button"
                        onclick={(e) => {
                            e.stopPropagation();
                            activeModal = 'blue';
                        }}
                    >
                        <small class="fw-semibold">
                            {#if uma.blueSpark && uma.blueSpark.stat}
                                {uma.blueSpark.stat} {'★'.repeat(uma.blueSpark.level)}
                            {:else}
                                Blue Spark
                            {/if}
                        </small>
                        {#if uma.blueSpark && affinityValue}
                            <small class="badge bg-primary">{blueChance().toFixed(0)}%</small>
                        {/if}
                    </button>

                    <!-- Pink Spark Button -->
                    <button
                        class="btn btn-sm btn-outline-pink text-start px-2 py-1 w-100 d-flex justify-content-between align-items-center"
                        type="button"
                        onclick={(e) => {
                            e.stopPropagation();
                            activeModal = 'pink';
                        }}
                    >
                        <small class="fw-semibold">
                            {#if uma.pinkSpark && uma.pinkSpark.stat}
                                {uma.pinkSpark.stat} {'★'.repeat(uma.pinkSpark.level)}
                            {:else}
                                Pink Spark
                            {/if}
                        </small>
                        {#if uma.pinkSpark && affinityValue}
                            <small class="badge badge-pink">{pinkChance().toFixed(0)}%</small>
                        {/if}
                    </button>

                    <!-- Green Spark Button -->
                    <button
                        class="btn btn-sm btn-outline-success text-start px-2 py-1 w-100 d-flex justify-content-between align-items-center"
                        type="button"
                        onclick={(e) => {
                            e.stopPropagation();
                            activeModal = 'green';
                        }}
                    >
                        <small class="fw-semibold">
                            {#if uma.greenSpark && uma.greenSpark.level}
                                Unique {'★'.repeat(uma.greenSpark.level)}
                            {:else}
                                Unique Spark
                            {/if}
                        </small>
                        {#if uma.greenSpark && affinityValue}
                            <small class="badge bg-success">{greenChance().toFixed(0)}%</small>
                        {/if}
                    </button>

                    <!-- Race & Skills Row -->
                    <div class="row g-1">
                        <div class="col-6">
                            <button
                                class="btn btn-sm btn-warning text-dark text-start px-2 py-1 w-100"
                                type="button"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    activeModal = 'race';
                                }}
                            >
                                <small class="fw-semibold">G1 ({uma.races?.length || 0})</small>
                            </button>
                        </div>
                        <div class="col-6">
                            <button
                                class="btn btn-sm btn-secondary text-start px-2 py-1 w-100"
                                type="button"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    activeModal = 'white';
                                }}
                            >
                                <small class="fw-semibold">Skills ({uma.whiteSpark?.length || 0})</small>
                            </button>
                        </div>
                    </div>

                    <!-- White spark badge list -->
                    {#if uma.whiteSpark && uma.whiteSpark.length > 0}
                        <div class="pt-1 border-top spark-badge-area">
                            {#each uma.whiteSpark as spark}
                                <span class="badge bg-secondary me-1 mb-1 spark-badge">
                                    {spark.stat} {'★'.repeat(spark.level)}
                                </span>
                            {/each}
                        </div>
                    {/if}

                </div>
            {/if}

            <!-- GGP (xs): pink spark only for aptitude contribution -->
            {#if label !== "Target" && size === 'xs'}
                <div class="mt-1">
                    <button
                        class="btn btn-sm btn-outline-pink text-start px-2 py-1 w-100"
                        type="button"
                        onclick={(e) => {
                            e.stopPropagation();
                            activeModal = 'pink';
                        }}
                    >
                        <small class="fw-semibold">
                            {#if uma.pinkSpark && uma.pinkSpark.stat}
                                {uma.pinkSpark.stat} {'★'.repeat(uma.pinkSpark.level)}
                            {:else}
                                Pink Spark
                            {/if}
                        </small>
                    </button>
                </div>
            {/if}
        </div>
    </div>
{:else}
    <div
        class="card {config.card} border-2 border-dashed shadow-sm h-100 uma-card-placeholder"
        style="border-color: {borderColor};"
        onclick={onSelect}
    >
        <div class="card-body p-3 d-flex flex-column align-items-center justify-content-center">
            <div class="text-muted text-center">
                <div class="mb-2" style="font-size: 2rem;">+</div>
                <div class="small">Select Uma</div>
                <div class="x-small text-muted">{label}</div>
            </div>
        </div>
    </div>
{/if}

<!-- Spark Editor Modals -->
{#if uma && label !== "Target" && activeModal}
    {#if activeModal === 'white'}
        <WhiteSparkSelector
            whiteSpark={uma.whiteSpark}
            onClose={() => activeModal = null}
            onChange={(sparks) => {
                if (onWhiteSparkChange) onWhiteSparkChange(sparks);
            }}
        />
    {:else}
        <SparkEditorModal
            type={activeModal}
            currentValue={
                activeModal === 'blue' ? uma.blueSpark :
                activeModal === 'pink' ? uma.pinkSpark :
                activeModal === 'green' ? uma.greenSpark :
                uma.races
            }
            races={allRaces}
            cardId={uma.card_id}
            onClose={() => activeModal = null}
            onChange={(value) => {
                if (activeModal === 'blue' && onBlueSparkChange) onBlueSparkChange(value);
                else if (activeModal === 'pink' && onPinkSparkChange) onPinkSparkChange(value);
                else if (activeModal === 'green' && onGreenSparkChange) onGreenSparkChange(value);
                else if (activeModal === 'race' && onRacesChange) onRacesChange(value);
            }}
        />
    {/if}
{/if}

<style>
    .uma-card-lg, .uma-card-md, .uma-card-sm, .uma-card-xs {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
        cursor: pointer;
        background: var(--bs-body-bg);
    }

    .uma-card-lg {
        min-height: 300px;
    }

    .uma-card-md {
        min-height: 300px;
    }

    .uma-card-sm {
        min-height: 300px;
    }

    .uma-card-xs {
        min-height: 180px;
        max-height: 220px;
    }

    .uma-card-clickable:hover, .uma-card-placeholder:hover {
        /* No transform here — transform creates a new stacking context which breaks
           position:fixed modals rendered inside the card (they'd be clipped/obscured
           by sibling cards painted later in the DOM). Use box-shadow only. */
        box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.4) !important;
    }

    .clear-btn {
        text-decoration: none;
        color: var(--bs-danger);
        background: transparent;
        border: none;
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        line-height: 1;
        opacity: 0.6;
        z-index: 10;
    }

    .clear-btn:hover {
        opacity: 1;
        color: var(--bs-danger);
        background: transparent;
    }

    .spark-display {
        font-size: 0.75rem;
    }

    .x-small {
        font-size: 0.7rem;
    }

    .spark-badge {
        font-size: 0.6rem;
        font-weight: 500;
    }

    .spark-badge-area {
        max-height: 72px;
        overflow-y: auto;
    }

    .apt-raise-badge {
        font-size: 0.65rem;
        font-weight: 500;
        white-space: nowrap;
    }

    /* Aptitude Grid */
    .apt-group-row {
        display: grid;
        grid-template-columns: 26px 1fr;
        align-items: center;
        gap: 2px;
        margin-bottom: 2px;
    }

    .apt-group-lbl {
        font-size: 0.48rem;
        font-weight: 700;
        color: var(--bs-secondary-color);
        text-transform: uppercase;
        text-align: right;
        padding-right: 2px;
    }

    .apt-chips-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2px;
    }

    .apt-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1px;
        border-radius: 3px;
        padding: 2px 3px;
        border: 1px solid transparent;
    }

    .apt-chip-empty {
        visibility: hidden;
    }

    .apt-lbl {
        font-size: 0.48rem;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
    }

    .apt-grade {
        font-size: 0.6rem;
        font-weight: 700;
        color: white;
        min-width: 10px;
        text-align: right;
    }

    .apt-high, .apt-mid, .apt-low { background: #757575; }

    .apt-raised {
        background: #c6417b !important;
        border-color: #c6417b !important;
        box-shadow: 0 0 4px rgba(198, 65, 123, 0.65);
    }

    /* Pink spark button / badge */
    .btn-outline-pink {
        color: #c6417b;
        border-color: #c6417b;
        background: transparent;
    }
    .btn-outline-pink:hover {
        background: #c6417b;
        color: white;
    }
    .badge-pink {
        background-color: #c6417b;
        color: white;
    }
</style>
