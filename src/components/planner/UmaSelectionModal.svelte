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
        parentContext?: { targetId?: number, siblingGrandparents: (any | null)[] };
    }

    interface FilterItem {
        id: string;
        stat: string;
        min: number;
        max: number;
    }

    const { trainedCharas = [], onClose, onSelectRoster, onSelectBorrow, isTargetSelection = false, parentContext }: Props = $props();

    let searchTerm = $state("");

    // Enable affinity sorting by default when we have a target
    let sortByAffinity = $state(parentContext?.targetId ? true : false);

    // For target (p0), always use borrow. For others, remember last selected tab
    let activeTab = $state<"roster" | "borrow">(isTargetSelection ? "borrow" : rememberedTab);

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
    const allCharacters = TerumiCharacterData.value
        .map((card) => ({
            charaId: card.charaId,
            charaName: card.charaName,
            cardId: card.cardId,
        }))
        .filter((char, index, self) =>
            index === self.findIndex((c) => c.charaName === char.charaName)
        )
        .sort((a, b) => a.charaName.localeCompare(b.charaName));

    const filteredRoster = $derived.by(() => {
        let filtered = trainedCharas;

        // Name filter
        if (searchTerm) {
            filtered = filtered.filter(uma =>
                getCharaName(uma.card_id).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply factor filters (same logic as Affinity.svelte)
        filtered = filtered.filter((uma) => {
            const card = charaCardsData[uma.card_id];
            if (!card) return false;

            // Blues filtering - check lineage mode
            if (filters.lineageMode) {
                // Dynamic filters
                if (filters.blues.length > 0) {
                    for (const filter of filters.blues) {
                        const stat = filter.stat.toLowerCase();
                        const raritySum =
                            (uma.blue_factor_rarities?.[stat] || 0) +
                            (uma.succession_chara_array[0]?.blue_factor_rarities?.[stat] || 0) +
                            (uma.succession_chara_array[1]?.blue_factor_rarities?.[stat] || 0);
                        if (raritySum < filter.min || raritySum > filter.max) return false;
                    }
                }

                // Reds dynamic filters
                if (filters.reds.length > 0) {
                    for (const filter of filters.reds) {
                        const raritySum =
                            (uma.red_factor_rarities?.[filter.stat] || 0) +
                            (uma.succession_chara_array[0]?.red_factor_rarities?.[filter.stat] || 0) +
                            (uma.succession_chara_array[1]?.red_factor_rarities?.[filter.stat] || 0);
                        if (raritySum < filter.min || raritySum > filter.max) return false;
                    }
                }
            } else {
                // Simple mode blues filtering
                const blueChecks = Object.entries(filters.simpleBlues)
                    .filter(([key, val]) => key !== "stars" && val === true)
                    .map(([key]) => key);
                if (blueChecks.length > 0) {
                    const hasAnyBlue = blueChecks.some((stat) => {
                        const rarity = uma.blue_factor_rarities?.[stat] || 0;
                        return rarity >= filters.simpleBlues.stars;
                    });
                    if (!hasAnyBlue) return false;
                }

                // Simple mode reds filtering
                const redChecks = Object.entries(filters.simpleReds)
                    .filter(([key, val]) => key !== "stars" && val === true)
                    .map(([key]) => key);
                if (redChecks.length > 0) {
                    const hasAnyRed = redChecks.some((stat) => {
                        const rarity = uma.red_factor_rarities?.[stat] || 0;
                        return rarity >= filters.simpleReds.stars;
                    });
                    if (!hasAnyRed) return false;
                }
            }

            // Total blues/reds filter
            if (filters.totalBlues.min > 0 || filters.totalBlues.max < 9) {
                const totalBlues = Object.values(uma.blue_factor_rarities || {}).reduce(
                    (sum, val) => sum + (val || 0),
                    0
                );
                if (totalBlues < filters.totalBlues.min || totalBlues > filters.totalBlues.max) {
                    return false;
                }
            }

            if (filters.totalReds.min > 0 || filters.totalReds.max < 9) {
                const totalReds = Object.values(uma.red_factor_rarities || {}).reduce(
                    (sum, val) => sum + (val || 0),
                    0
                );
                if (totalReds < filters.totalReds.min || totalReds > filters.totalReds.max) {
                    return false;
                }
            }

            // Greens filter
            if (filters.greens.stars > 0) {
                const greenStars = uma.green_factor_rarity || 0;
                if (greenStars < filters.greens.stars) return false;
            }

            // Whites filter
            const whiteFilters = Object.entries(filters.whites).filter(([_, stars]) => stars > 0);
            if (whiteFilters.length > 0) {
                const factorIds = filters.whitesIncludeParents
                    ? [
                        ...uma.factor_id_array,
                        ...(uma.succession_chara_array[0]?.factor_id_array || []),
                        ...(uma.succession_chara_array[1]?.factor_id_array || []),
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
                const withAffinity = filtered.map(uma => {
                    const umaCharaId = charaCardsData[uma.card_id]?.chara_id.toString();
                    if (umaCharaId === targetCharaId) {
                        return { uma, affinity: -1 };
                    }

                    const affinity = calculateSingleParentAffinity(targetCharaId, uma);
                    return { uma, affinity: affinity.totalAffinity };
                });

                return withAffinity
                    .sort((a, b) => b.affinity - a.affinity)
                    .map(item => item.uma);
            }
        }

        // Default sort by date descending
        return filtered.sort((a, b) =>
            (b.trained_chara_create_time || 0) - (a.trained_chara_create_time || 0)
        );
    });

    const filteredBorrow = $derived.by(() => {
        let filtered = allCharacters.filter(char =>
            char.charaName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort by affinity if we have target context and affinity sorting is enabled
        if (sortByAffinity && parentContext?.targetId) {
            const targetCard = charaCardsData[parentContext.targetId];
            const targetCharaId = targetCard?.chara_id.toString();

            if (targetCharaId) {
                const withAffinity = filtered.map(char => {
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
                        win_saddle_id_array: []
                    };

                    const affinity = calculateSingleParentAffinity(
                        targetCharaId,
                        minimalUma as CharaData
                    );

                    return { char, affinity: affinity.totalAffinity };
                });

                return withAffinity
                    .sort((a, b) => b.affinity - a.affinity)
                    .map(item => item.char);
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

    function handleSelectBorrow(char: typeof allCharacters[0]) {
        // Create a minimal CharaData for borrow
        const borrowUma: Partial<CharaData> = {
            card_id: char.cardId,
            talent_level: 0,
            factor_id_array: [],
            win_saddle_id_array: []
        };
        onSelectBorrow(borrowUma as CharaData);
    }
</script>

<div class="modal-backdrop" onclick={onClose}></div>
<div class="modal-dialog-centered">
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h5 class="modal-title">Select Uma Musume</h5>
            <button type="button" class="btn-close" onclick={onClose}></button>
        </div>

        <div class="modal-body">
            <!-- Search and Filters bar -->
            <div class="d-flex gap-2 align-items-center mb-3">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Search by name..."
                    bind:value={searchTerm}
                    style="width: 200px;"
                />

                {#if !isTargetSelection && activeTab === "roster"}
                    <Filter
                        bind:filters={filters}
                        availableWhites={availableWhites()}
                    />
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
                        <label class="form-check-label small" for="sortAffinity">
                            Sort by Affinity {#if !parentContext?.targetId}<span class="text-muted">(select p0 first)</span>{/if}
                        </label>
                    </div>
                {/if}
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs mb-3">
                {#if !isTargetSelection}
                    <li class="nav-item">
                        <button
                            class="nav-link {activeTab === 'roster' ? 'active' : ''}"
                            onclick={() => activeTab = 'roster'}
                        >
                            From Roster ({trainedCharas.length})
                        </button>
                    </li>
                {/if}
                <li class="nav-item">
                    <button
                        class="nav-link {activeTab === 'borrow' ? 'active' : ''}"
                        onclick={() => activeTab = 'borrow'}
                    >
                        {isTargetSelection ? 'Select Character' : 'Borrow/Placeholder'} ({allCharacters.length})
                    </button>
                </li>
            </ul>

            <!-- Content -->
            <div class="uma-list">
                {#if activeTab === 'roster'}
                    {#if filteredRoster.length === 0}
                        <div class="text-center text-muted py-4">
                            No umas found in your roster
                        </div>
                    {:else}
                        <div class="row g-2">
                            {#each filteredRoster as uma}
                                <div class="col-12">
                                    <div class="uma-item card" onclick={() => handleSelectRoster(uma)}>
                                        <div class="card-body p-2">
                                            <div class="d-flex align-items-center gap-2">
                                                <img
                                                    src={getCharaImageUrl(uma.card_id, uma.talent_level)}
                                                    alt={getCharaName(uma.card_id)}
                                                    class="rounded-circle flex-shrink-0"
                                                    style="width: 40px; height: 40px; object-fit: cover;"
                                                />
                                                <div class="flex-fill" style="min-width: 0;">
                                                    <div class="fw-bold small text-truncate text-center">{getCharaName(uma.card_id)}</div>
                                                    <div class="d-flex flex-wrap gap-2 justify-content-center">
                                                        {#if parentContext?.targetId}
                                                            {@const targetCharaId = charaCardsData[parentContext.targetId]?.chara_id.toString()}
                                                            {@const umaCharaId = charaCardsData[uma.card_id]?.chara_id.toString()}
                                                            {#if targetCharaId && umaCharaId !== targetCharaId}
                                                                {@const affinity = calculateSingleParentAffinity(targetCharaId, uma)}
                                                                <small class="text-muted">Affinity: <span class="text-body">{affinity.totalAffinity}</span></small>
                                                            {/if}
                                                        {/if}
                                                        {#if uma.rank_score !== undefined}
                                                            <small class="text-muted">Score: <span class="text-body">{uma.rank_score.toLocaleString()}</span></small>
                                                        {/if}
                                                        {#if uma.create_time}
                                                            <small class="text-muted">{uma.create_time.split(' ')[0]}</small>
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
                {:else}
                    {#if filteredBorrow.length === 0}
                        <div class="text-center text-muted py-4">
                            No characters found
                        </div>
                    {:else}
                        <div class="row g-2">
                            {#each filteredBorrow as char}
                                <div class="col-12">
                                    <div class="uma-item card" onclick={() => handleSelectBorrow(char)}>
                                        <div class="card-body p-2">
                                            <div class="d-flex align-items-center gap-2">
                                                <img
                                                    src={getCharaImageUrl(char.cardId, 0)}
                                                    alt={char.charaName}
                                                    class="rounded-circle flex-shrink-0"
                                                    style="width: 40px; height: 40px; object-fit: cover;"
                                                />
                                                <div class="flex-fill" style="min-width: 0;">
                                                    <div class="fw-bold small text-truncate">{char.charaName}</div>
                                                    {#if sortByAffinity && parentContext?.targetId}
                                                        {@const targetCharaId = charaCardsData[parentContext.targetId]?.chara_id.toString()}
                                                        {@const charCard = charaCardsData[char.cardId]}
                                                        {@const charCharaId = charCard?.chara_id.toString()}
                                                        {#if targetCharaId && charCharaId !== targetCharaId}
                                                            {@const minimalUma = { card_id: char.cardId, talent_level: 0, factor_id_array: [], win_saddle_id_array: [] }}
                                                            {@const affinity = calculateSingleParentAffinity(targetCharaId, minimalUma)}
                                                            <small class="text-muted">Affinity: {affinity.totalAffinity}</small>
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
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1040;
    }

    .modal-dialog-centered {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1050;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
    }

    .modal-content {
        background: var(--bs-dark);
        border: 1px solid var(--bs-border-color);
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        max-height: 90vh;
    }

    .modal-header {
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-body {
        padding: 1rem;
        overflow-y: auto;
        flex: 1;
    }

    .uma-list {
        height: 55vh;
        overflow-y: auto;
    }

    .uma-item {
        cursor: pointer;
        transition: all 0.2s ease;
        background: var(--bs-body-bg);
        border: 1px solid var(--bs-border-color);
    }

    .uma-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.3);
        border-color: var(--bs-primary);
    }

    .nav-link {
        cursor: pointer;
        background: none;
        border: none;
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
    }

    .btn-close:hover {
        opacity: 1;
    }

    .btn-close:before {
        content: "×";
    }
</style>
