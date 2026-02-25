<script module>
    // Remember the last selected tab across modal opens (but not for target selection)
    let rememberedTab: "roster" | "borrow" = "roster";
</script>

<script lang="ts">
    import type { CharaData } from "../../types";
    import { charaCardsData, skillsData, factorsData } from "../../data";
    import { getIconCardId } from "../../utils/iconMapping";
    import { calculateSingleParentAffinity } from "../../utils/affinity";
    import TerumiCharacterData from "../../assets/TerumiCharacterData.json";
    import Filter from "../Filter.svelte";

    interface Props {
        trainedCharas?: CharaData[];
        onClose: () => void;
        onSelectRoster: (uma: CharaData) => void;
        onSelectBorrow: (uma: CharaData) => void;
        isTargetSelection?: boolean;
        parentContext?: {
            targetId?: number;
            siblingGrandparents: (any | null)[];
        };
    }

    interface FilterItem {
        id: string;
        stat: string;
        min: number;
        max: number;
    }

    const {
        trainedCharas = [],
        onClose,
        onSelectRoster,
        onSelectBorrow,
        isTargetSelection = false,
        parentContext,
    }: Props = $props();

    let searchTerm = $state("");

    // Enable affinity sorting by default when we have a target
    let sortByAffinity = $state(parentContext?.targetId ? true : false);

    // For target (p0), always use borrow. For others, remember last selected tab
    let activeTab = $state<"roster" | "borrow">(
        isTargetSelection ? "borrow" : rememberedTab,
    );

    // Sync tab selection back to module-level memory
    $effect(() => {
        if (!isTargetSelection) {
            rememberedTab = activeTab;
        }
    });

    // Filters state (same as Affinity.svelte)
    let filters = $state({
        blues: [] as FilterItem[],
        reds: [] as FilterItem[],
        totalBlues: { min: 0, max: 9 },
        totalReds: { min: 0, max: 9 },
        greens: { stars: 0 },
        whites: {} as { [key: string]: number },
        whitesIncludeParents: false,
        lineageMode: true,
        simpleBlues: {
            speed: false,
            stamina: false,
            power: false,
            guts: false,
            wit: false,
            stars: 1,
        },
        simpleReds: {
            turf: false,
            dirt: false,
            frontRunner: false,
            paceChaser: false,
            lateSurger: false,
            endCloser: false,
            sprint: false,
            mile: false,
            medium: false,
            long: false,
            stars: 1,
        },
    });

    // Helper: sum rarity per factor name for a given type from an array of factor IDs
    function starsByName(ids: number[], type: number): Record<string, number> {
        const result: Record<string, number> = {};
        for (const id of ids) {
            const f = factorsData[id];
            if (f?.type === type) {
                result[f.name] = (result[f.name] || 0) + f.rarity;
            }
        }
        return result;
    }

    const availableWhites = $derived(() => {
        const factorIds = new Set<number>();
        trainedCharas.forEach((chara) => {
            chara.factor_id_array.forEach((id) => factorIds.add(id));
            chara.succession_chara_array.forEach((s) =>
                s.factor_id_array.forEach((id) => factorIds.add(id)),
            );
        });
        const whiteNames = new Set<string>();
        factorIds.forEach((id) => {
            const f = factorsData[id];
            if (f?.type === 4 || f?.type === 5 || f?.type === 6)
                whiteNames.add(f.name);
        });
        return Array.from(whiteNames).sort();
    });

    // Get all unique characters for borrow
    const allCharacters = (TerumiCharacterData as unknown as any[])
        .map((card) => ({
            charaId: card.charaId,
            charaName: card.charaName,
            cardId: card.cardId,
        }))
        .filter(
            (char, index, self) =>
                index === self.findIndex((c) => c.charaName === char.charaName),
        )
        .sort((a, b) => a.charaName.localeCompare(b.charaName));

    const filteredRoster = $derived.by(() => {
        let filtered = trainedCharas;

        // Name filter
        if (searchTerm) {
            filtered = filtered.filter((uma) =>
                getCharaName(uma.card_id)
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        }

        // Apply factor filters
        filtered = filtered.filter((uma) => {
            const card = charaCardsData[uma.card_id];
            if (!card) return false;

            const p1Ids = uma.succession_chara_array[0]?.factor_id_array || [];
            const p2Ids = uma.succession_chara_array[1]?.factor_id_array || [];

            if (filters.lineageMode) {
                // Dynamic blue filters — filter.stat matches factor names exactly (e.g. "Speed")
                if (filters.blues.length > 0) {
                    const ownBlues = starsByName(uma.factor_id_array, 1);
                    const p1Blues = starsByName(p1Ids, 1);
                    const p2Blues = starsByName(p2Ids, 1);
                    for (const filter of filters.blues) {
                        const raritySum =
                            (ownBlues[filter.stat] || 0) +
                            (p1Blues[filter.stat] || 0) +
                            (p2Blues[filter.stat] || 0);
                        if (raritySum < filter.min || raritySum > filter.max)
                            return false;
                    }
                }

                // Dynamic red filters
                if (filters.reds.length > 0) {
                    const ownReds = starsByName(uma.factor_id_array, 2);
                    const p1Reds = starsByName(p1Ids, 2);
                    const p2Reds = starsByName(p2Ids, 2);
                    for (const filter of filters.reds) {
                        const raritySum =
                            (ownReds[filter.stat] || 0) +
                            (p1Reds[filter.stat] || 0) +
                            (p2Reds[filter.stat] || 0);
                        if (raritySum < filter.min || raritySum > filter.max)
                            return false;
                    }
                }
            } else {
                // Simple mode blues — direct check, same as TrainedCharaList
                const sb = filters.simpleBlues;
                const hasBlueSelection =
                    sb.speed || sb.stamina || sb.power || sb.guts || sb.wit;
                if (hasBlueSelection) {
                    const stars = sb.stars;
                    const matchesAnyBlue = uma.factor_id_array.some((id) => {
                        const f = factorsData[id];
                        if (!f || f.type !== 1) return false;
                        return (
                            (sb.speed &&
                                f.name === "Speed" &&
                                f.rarity >= stars) ||
                            (sb.stamina &&
                                f.name === "Stamina" &&
                                f.rarity >= stars) ||
                            (sb.power &&
                                f.name === "Power" &&
                                f.rarity >= stars) ||
                            (sb.guts &&
                                f.name === "Guts" &&
                                f.rarity >= stars) ||
                            (sb.wit && f.name === "Wit" && f.rarity >= stars)
                        );
                    });
                    if (!matchesAnyBlue) return false;
                }

                // Simple mode reds — direct check, same as TrainedCharaList
                const sr = filters.simpleReds;
                const hasRedSelection =
                    sr.turf ||
                    sr.dirt ||
                    sr.frontRunner ||
                    sr.paceChaser ||
                    sr.lateSurger ||
                    sr.endCloser ||
                    sr.sprint ||
                    sr.mile ||
                    sr.medium ||
                    sr.long;
                if (hasRedSelection) {
                    const stars = sr.stars;
                    const matchesAnyRed = uma.factor_id_array.some((id) => {
                        const f = factorsData[id];
                        if (!f || f.type !== 2) return false;
                        return (
                            (sr.turf &&
                                f.name === "Turf" &&
                                f.rarity >= stars) ||
                            (sr.dirt &&
                                f.name === "Dirt" &&
                                f.rarity >= stars) ||
                            (sr.frontRunner &&
                                f.name === "Front Runner" &&
                                f.rarity >= stars) ||
                            (sr.paceChaser &&
                                f.name === "Pace Chaser" &&
                                f.rarity >= stars) ||
                            (sr.lateSurger &&
                                f.name === "Late Surger" &&
                                f.rarity >= stars) ||
                            (sr.endCloser &&
                                f.name === "End Closer" &&
                                f.rarity >= stars) ||
                            (sr.sprint &&
                                f.name === "Sprint" &&
                                f.rarity >= stars) ||
                            (sr.mile &&
                                f.name === "Mile" &&
                                f.rarity >= stars) ||
                            (sr.medium &&
                                f.name === "Medium" &&
                                f.rarity >= stars) ||
                            (sr.long && f.name === "Long" && f.rarity >= stars)
                        );
                    });
                    if (!matchesAnyRed) return false;
                }
            }

            // Total blues/reds — only active in lineage mode, same as TrainedCharaList
            if (
                filters.lineageMode &&
                (filters.totalBlues.min > 0 || filters.totalBlues.max < 9)
            ) {
                const totalBlues =
                    Object.values(starsByName(uma.factor_id_array, 1)).reduce(
                        (a, b) => a + b,
                        0,
                    ) +
                    Object.values(starsByName(p1Ids, 1)).reduce(
                        (a, b) => a + b,
                        0,
                    ) +
                    Object.values(starsByName(p2Ids, 1)).reduce(
                        (a, b) => a + b,
                        0,
                    );
                if (
                    totalBlues < filters.totalBlues.min ||
                    totalBlues > filters.totalBlues.max
                )
                    return false;
            }

            if (
                filters.lineageMode &&
                (filters.totalReds.min > 0 || filters.totalReds.max < 9)
            ) {
                const totalReds =
                    Object.values(starsByName(uma.factor_id_array, 2)).reduce(
                        (a, b) => a + b,
                        0,
                    ) +
                    Object.values(starsByName(p1Ids, 2)).reduce(
                        (a, b) => a + b,
                        0,
                    ) +
                    Object.values(starsByName(p2Ids, 2)).reduce(
                        (a, b) => a + b,
                        0,
                    );
                if (
                    totalReds < filters.totalReds.min ||
                    totalReds > filters.totalReds.max
                )
                    return false;
            }

            // Greens — threshold > 1 matches TrainedCharaList (1★ button = no filter)
            if (filters.greens.stars > 1) {
                const hasGreen = uma.factor_id_array.some((id) => {
                    const f = factorsData[id];
                    return f?.type === 3 && f.rarity >= filters.greens.stars;
                });
                if (!hasGreen) return false;
            }

            // Whites filter
            const whiteFilters = Object.entries(filters.whites).filter(
                ([_, stars]) => stars > 0,
            );
            if (whiteFilters.length > 0) {
                const factorIds = filters.whitesIncludeParents
                    ? [
                          ...uma.factor_id_array,
                          ...(uma.succession_chara_array[0]?.factor_id_array ||
                              []),
                          ...(uma.succession_chara_array[1]?.factor_id_array ||
                              []),
                      ]
                    : uma.factor_id_array;

                for (const [whiteName, minStars] of whiteFilters) {
                    const matchingFactors = factorIds.filter((id) => {
                        const f = factorsData[id];
                        return f?.name === whiteName && f.rarity >= minStars;
                    });
                    if (matchingFactors.length === 0) return false;
                }
            }

            return true;
        });

        // Sort by affinity if we have target context
        if (sortByAffinity && parentContext?.targetId) {
            const targetCard = charaCardsData[parentContext.targetId];
            const targetCharaId = targetCard?.chara_id.toString();

            if (targetCharaId) {
                const withAffinity = filtered.map((uma) => {
                    const umaCharaId =
                        charaCardsData[uma.card_id]?.chara_id.toString();
                    if (umaCharaId === targetCharaId) {
                        return { uma, affinity: -1 };
                    }

                    const affinity = calculateSingleParentAffinity(
                        targetCharaId,
                        uma,
                    );
                    return { uma, affinity: affinity.totalAffinity };
                });

                return withAffinity
                    .sort((a, b) => b.affinity - a.affinity)
                    .map((item) => item.uma);
            }
        }

        // Default sort by date descending
        return filtered.sort((a, b) => {
            const dateA = a.create_time ? new Date(a.create_time).getTime() : 0;
            const dateB = b.create_time ? new Date(b.create_time).getTime() : 0;
            return dateB - dateA;
        });
    });

    const filteredBorrow = $derived.by(() => {
        let filtered = allCharacters.filter((char) =>
            char.charaName.toLowerCase().includes(searchTerm.toLowerCase()),
        );

        // Sort by affinity if we have target context and affinity sorting is enabled
        if (sortByAffinity && parentContext?.targetId) {
            const targetCard = charaCardsData[parentContext.targetId];
            const targetCharaId = targetCard?.chara_id.toString();

            if (targetCharaId) {
                const withAffinity = filtered.map((char) => {
                    // Skip if this char is the same character as the target
                    const charCard = charaCardsData[char.cardId];
                    const charCharaId = charCard?.chara_id.toString();
                    if (charCharaId === targetCharaId) {
                        return { char, affinity: -1 }; // Put at bottom
                    }

                    // Create minimal CharaData for affinity calculation
                    const minimalUma: Partial<CharaData> = {
                        card_id: char.cardId,
                        talent_level: 0,
                        factor_id_array: [],
                        win_saddle_id_array: [],
                    };

                    const affinity = calculateSingleParentAffinity(
                        targetCharaId,
                        minimalUma as CharaData,
                    );

                    return { char, affinity: affinity.totalAffinity };
                });

                return withAffinity
                    .sort((a, b) => b.affinity - a.affinity)
                    .map((item) => item.char);
            }
        }

        // Default sort by name
        return filtered;
    });

    function getCharaName(cardId: number): string {
        const card = charaCardsData[cardId];
        return card?.name || "Unknown";
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

    function handleSelectRoster(uma: CharaData) {
        onSelectRoster(uma);
    }

    function handleSelectBorrow(char: (typeof allCharacters)[0]) {
        // Create a minimal CharaData for borrow
        const borrowUma: Partial<CharaData> = {
            card_id: char.cardId,
            talent_level: 0,
            factor_id_array: [],
            win_saddle_id_array: [],
        };
        onSelectBorrow(borrowUma as CharaData);
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onClose}></div>
<div class="modal-dialog-centered">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h5 class="modal-title">Select Uma Musume</h5>
            <button type="button" class="btn-close" onclick={onClose} aria-label="Close"></button>
        </div>

        <div class="modal-body">
            <!-- Search and Filters bar -->
            <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
                <input
                    type="text"
                    class="form-control form-control-sm search-input"
                    placeholder="Search by name..."
                    bind:value={searchTerm}
                />

                {#if !isTargetSelection && activeTab === "roster"}
                    <Filter bind:filters availableWhites={availableWhites()} />
                {/if}

                {#if !isTargetSelection}
                    <div class="form-check ms-auto">
                        <input
                            class="form-check-input"
                            type="checkbox"
                            id="sortAffinity"
                            bind:checked={sortByAffinity}
                            disabled={!parentContext?.targetId}
                        />
                        <label
                            class="form-check-label small"
                            for="sortAffinity"
                        >
                            Sort by Affinity {#if !parentContext?.targetId}<span
                                    class="text-muted">(select p0 first)</span
                                >{/if}
                        </label>
                    </div>
                {/if}
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs mb-3">
                {#if !isTargetSelection}
                    <li class="nav-item">
                        <button
                            class="nav-link {activeTab === 'roster'
                                ? 'active'
                                : ''}"
                            onclick={() => (activeTab = "roster")}
                        >
                            From Roster ({trainedCharas.length})
                        </button>
                    </li>
                {/if}
                <li class="nav-item">
                    <button
                        class="nav-link {activeTab === 'borrow'
                            ? 'active'
                            : ''}"
                        onclick={() => (activeTab = "borrow")}
                    >
                        {isTargetSelection
                            ? "Select Character"
                            : "Borrow/Placeholder"} ({allCharacters.length})
                    </button>
                </li>
            </ul>

            <!-- Content -->
            <div class="uma-list">
                {#if activeTab === "roster"}
                    {#if filteredRoster.length === 0}
                        <div class="text-center text-muted py-4">
                            No umas found in your roster
                        </div>
                    {:else}
                        <div class="row g-2">
                            {#each filteredRoster as uma}
                                <div class="col-12">
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div
                                        class="uma-item card"
                                        onclick={() => handleSelectRoster(uma)}
                                    >
                                        <div class="card-body p-2">
                                            <div
                                                class="d-flex align-items-center gap-2"
                                            >
                                                <img
                                                    src={getCharaImageUrl(
                                                        uma.card_id,
                                                        uma.talent_level,
                                                    )}
                                                    alt={getCharaName(
                                                        uma.card_id,
                                                    )}
                                                    class="flex-shrink-0"
                                                    style="width: 40px; height: 40px; object-fit: cover; border-radius: 0.25rem;"
                                                />
                                                <div
                                                    class="flex-fill"
                                                    style="min-width: 0;"
                                                >
                                                    <div
                                                        class="fw-bold small text-truncate text-center"
                                                    >
                                                        {getCharaName(
                                                            uma.card_id,
                                                        )}
                                                    </div>
                                                    <div
                                                        class="d-flex flex-wrap gap-2 justify-content-center"
                                                    >
                                                        {#if parentContext?.targetId}
                                                            {@const targetCharaId =
                                                                charaCardsData[
                                                                    parentContext
                                                                        .targetId
                                                                ]?.chara_id.toString()}
                                                            {@const umaCharaId =
                                                                charaCardsData[
                                                                    uma.card_id
                                                                ]?.chara_id.toString()}
                                                            {#if targetCharaId && umaCharaId !== targetCharaId}
                                                                {@const affinity =
                                                                    calculateSingleParentAffinity(
                                                                        targetCharaId,
                                                                        uma,
                                                                    )}
                                                                <small
                                                                    class="text-muted"
                                                                    >Affinity: <span
                                                                        class="text-body"
                                                                        >{affinity.totalAffinity}</span
                                                                    ></small
                                                                >
                                                            {/if}
                                                        {/if}
                                                        {#if uma.rank_score !== undefined}
                                                            <small
                                                                class="text-muted"
                                                                >Score: <span
                                                                    class="text-body"
                                                                    >{uma.rank_score.toLocaleString()}</span
                                                                ></small
                                                            >
                                                        {/if}
                                                        {#if uma.create_time}
                                                            <small
                                                                class="text-muted"
                                                                >{uma.create_time.split(
                                                                    " ",
                                                                )[0]}</small
                                                            >
                                                        {/if}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                {:else if filteredBorrow.length === 0}
                    <div class="text-center text-muted py-4">
                        No characters found
                    </div>
                {:else}
                    <div class="row g-2">
                        {#each filteredBorrow as char}
                            <div class="col-12">
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="uma-item card"
                                    onclick={() => handleSelectBorrow(char)}
                                >
                                    <div class="card-body p-2">
                                        <div
                                            class="d-flex align-items-center gap-2"
                                        >
                                            <img
                                                src={getCharaImageUrl(
                                                    char.cardId,
                                                    0,
                                                )}
                                                alt={char.charaName}
                                                class="flex-shrink-0"
                                                style="width: 40px; height: 40px; object-fit: cover; border-radius: 0.25rem;"
                                            />
                                            <div
                                                class="flex-fill"
                                                style="min-width: 0;"
                                            >
                                                <div
                                                    class="fw-bold small text-truncate"
                                                >
                                                    {char.charaName}
                                                </div>
                                                {#if sortByAffinity && parentContext?.targetId}
                                                    {@const targetCharaId =
                                                        charaCardsData[
                                                            parentContext
                                                                .targetId
                                                        ]?.chara_id.toString()}
                                                    {@const charCard =
                                                        charaCardsData[
                                                            char.cardId
                                                        ]}
                                                    {@const charCharaId =
                                                        charCard?.chara_id.toString()}
                                                    {#if targetCharaId && charCharaId !== targetCharaId}
                                                        {@const affinity =
                                                            calculateSingleParentAffinity(
                                                                targetCharaId,
                                                                {
                                                                    card_id: char.cardId,
                                                                    talent_level: 0,
                                                                    factor_id_array: [],
                                                                    win_saddle_id_array: [],
                                                                } as unknown as CharaData,
                                                            )}
                                                        <small
                                                            class="text-muted"
                                                            >Affinity: {affinity.totalAffinity}</small
                                                        >
                                                    {/if}
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1040;
    }

    .modal-dialog-centered {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1050;
        width: 94%;
        max-width: 700px;
        max-height: 85vh;
    }

    .modal-content {
        background: var(--bs-dark);
        border: 1px solid var(--bs-border-color);
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        max-height: 85vh;
        overflow: hidden;
    }

    .modal-header {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--bs-body-color);
        margin: 0;
    }

    .modal-body {
        padding: 1rem;
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1;
    }

    .search-input {
        width: 200px;
        flex-shrink: 0;
    }

    @media (max-width: 575.98px) {
        .modal-dialog-centered {
            width: 96%;
            max-height: 90vh;
        }

        .modal-content {
            max-height: 90vh;
        }

        .modal-header {
            padding: 0.75rem 1rem;
        }

        .modal-title {
            font-size: 1rem;
        }

        .modal-body {
            padding: 0.75rem;
        }

        .search-input {
            width: 100%;
            flex-shrink: 1;
        }
    }

    .uma-list {
        height: 50vh;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 0.5rem;
    }

    @media (max-width: 575.98px) {
        .uma-list {
            height: 45vh;
            padding-right: 0.25rem;
        }
    }

    .uma-item {
        cursor: pointer;
        transition: all 0.15s ease;
        background: var(--bs-body-bg);
        border: 1px solid var(--bs-border-color);
        border-radius: 0.375rem;
    }

    .uma-item:hover {
        border-color: var(--bs-primary);
        box-shadow: 0 0 0 1px var(--bs-primary);
    }

    .nav-tabs {
        border-bottom: 1px solid var(--bs-border-color);
    }

    .nav-link {
        cursor: pointer;
        background: transparent;
        border: none;
        white-space: nowrap;
        color: var(--bs-body-color);
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        opacity: 0.7;
        transition: opacity 0.15s ease;
    }

    .nav-link:hover {
        opacity: 1;
    }

    .nav-link.active {
        opacity: 1;
        border-bottom: 2px solid var(--bs-primary);
    }

    @media (max-width: 575.98px) {
        .nav-tabs {
            flex-wrap: wrap;
        }

        .nav-link {
            font-size: 0.75rem;
            padding: 0.4rem 0.6rem;
        }
    }

    .btn-close {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        font-weight: bold;
        line-height: 1;
        color: var(--bs-body-color);
        opacity: 0.5;
        cursor: pointer;
        transition: opacity 0.15s ease;
    }

    .btn-close:hover {
        opacity: 1;
    }

    .btn-close:before {
        content: "×";
    }
</style>
