<script lang="ts">
    import type { CharaData } from "../types";
    import Chara from "../components/Chara.svelte";
    import Filter from "../components/Filter.svelte";
    import {
        calculateSingleParentAffinity,
        type AffinityResult,
    } from "../utils/affinity";
    import { charaCardsData, factorsData } from "../data";
    import TerumiCharacterData from "../assets/TerumiCharacterData.json";

    interface Props {
        trainedCharas: CharaData[];
    }
    const { trainedCharas }: Props = $props();

    interface FilterItem {
        id: string;
        stat: string;
        min: number;
        max: number;
    }

    function goBack() {
        window.location.hash = "";
    }

    // Get all available character names for the selector
    const allCharacters = (TerumiCharacterData as unknown as any[])
        .map((card) => ({
            charaId: card.charaId.toString(),
            charaName: card.charaName,
            cardId: card.cardId,
        }))
        // Sort alphabetically and remove duplicates
        .sort((a, b) => a.charaName.localeCompare(b.charaName));

    // Remove duplicates based on charaName
    const uniqueCharacters = allCharacters.filter(
        (char, index, self) =>
            index === self.findIndex((c) => c.charaName === char.charaName),
    );

    let selectedCharaId = $state<string>("");
    let sortedUmas = $state<
        Array<{ uma: CharaData; affinity: AffinityResult }>
    >([]);
    let searchQuery = $state("");

    // Default display settings for Chara component
    const display = { stats: true, factors: true, racesWon: false };

    // Filters state
    let filters = $state({
        blues: [] as FilterItem[],
        reds: [] as FilterItem[],
        totalBlues: { min: 0, max: 9 },
        totalReds: { min: 0, max: 9 },
        greens: { stars: 0 },
        whites: {} as { [key: string]: number },
        whitesIncludeParents: false,
        lineageMode: true, // Always true for affinity - we care about breeding potential
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
            // Type 4 = skill, Type 5 = race, Type 6 = scenario
            if (f?.type === 4 || f?.type === 5 || f?.type === 6)
                whiteNames.add(f.name);
        });
        return Array.from(whiteNames).sort();
    });

    function calculateAffinities() {
        if (!selectedCharaId) {
            sortedUmas = [];
            return;
        }

        const results: Array<{ uma: CharaData; affinity: AffinityResult }> = [];

        // Calculate affinity for each uma as Parent 1 (p2 is placeholder)
        // Filter out the selected target uma - an uma cannot be its own parent
        for (const uma of trainedCharas) {
            // Get the chara_id for this roster uma
            const umaCharaId = charaCardsData[uma.card_id]?.chara_id.toString();

            // Skip if this uma is the same character as the selected target
            if (umaCharaId === selectedCharaId) {
                continue;
            }

            const affinity = calculateSingleParentAffinity(
                selectedCharaId,
                uma,
            );
            results.push({ uma, affinity });
        }

        // Sort by total affinity (descending)
        sortedUmas = results.sort(
            (a, b) => b.affinity.totalAffinity - a.affinity.totalAffinity,
        );

        console.log(
            `[Affinity Page] Evaluated ${sortedUmas.length} umas from roster (filtered out selected character)`,
        );
        console.log(
            `[Affinity Page] Top affinity: ${sortedUmas[0]?.affinity.totalAffinity || 0}`,
        );
        if (sortedUmas.length > 0) {
            console.log(
                `[Affinity Page] Top 3 umas:`,
                sortedUmas.slice(0, 3).map((u) => ({
                    uma: u.uma.card_id,
                    total: u.affinity.totalAffinity,
                    breakdown: u.affinity.breakdown,
                })),
            );
        }
    }

    function onCharaSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedCharaId = target.value;
        calculateAffinities();
    }

    // Filter sorted umas based on search query and filters
    const filteredUmas = $derived.by(() => {
        let result = sortedUmas;

        // Search filter
        if (searchQuery) {
            result = result.filter((item) => {
                const charaName = charaCardsData[item.uma.card_id]?.name || "";
                return charaName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            });
        }

        // Apply factor filters
        result = result.filter((item) => {
            const chara = item.uma;
            let isDisplayed = true;

            const allFactors = chara.factor_id_array;

            // Blues filtering - check mode
            if (filters.lineageMode) {
                // Lineage Mode: Dynamic filters
                if (filters.blues.length > 0) {
                    const currentBlue = chara.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 1);
                    const parent1Blue =
                        chara.succession_chara_array[0]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 1);
                    const parent2Blue =
                        chara.succession_chara_array[1]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 1);

                    const statStars = {
                        Speed: 0,
                        Stamina: 0,
                        Power: 0,
                        Guts: 0,
                        Wit: 0,
                    };
                    [currentBlue, parent1Blue, parent2Blue].forEach((f) => {
                        if (f && f.name in statStars) {
                            statStars[f.name as keyof typeof statStars] +=
                                f.rarity;
                        }
                    });

                    for (const filter of filters.blues) {
                        const statValue =
                            statStars[filter.stat as keyof typeof statStars] ||
                            0;
                        if (statValue < filter.min || statValue > filter.max) {
                            isDisplayed = false;
                            break;
                        }
                    }
                }
            } else {
                // Simple Mode: Check only current unit's blue factor (OR logic)
                const hasBlueSelection =
                    filters.simpleBlues.speed ||
                    filters.simpleBlues.stamina ||
                    filters.simpleBlues.power ||
                    filters.simpleBlues.guts ||
                    filters.simpleBlues.wit;

                if (hasBlueSelection) {
                    const currentBlue = chara.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 1);

                    // Show if the blue factor matches ANY selected stat with required stars
                    const matchesAnyBlue =
                        (filters.simpleBlues.speed &&
                            currentBlue?.name === "Speed" &&
                            currentBlue.rarity >= filters.simpleBlues.stars) ||
                        (filters.simpleBlues.stamina &&
                            currentBlue?.name === "Stamina" &&
                            currentBlue.rarity >= filters.simpleBlues.stars) ||
                        (filters.simpleBlues.power &&
                            currentBlue?.name === "Power" &&
                            currentBlue.rarity >= filters.simpleBlues.stars) ||
                        (filters.simpleBlues.guts &&
                            currentBlue?.name === "Guts" &&
                            currentBlue.rarity >= filters.simpleBlues.stars) ||
                        (filters.simpleBlues.wit &&
                            currentBlue?.name === "Wit" &&
                            currentBlue.rarity >= filters.simpleBlues.stars);

                    if (!matchesAnyBlue) {
                        isDisplayed = false;
                    }
                }
            }

            // Reds filtering - check mode
            if (filters.lineageMode) {
                // Lineage Mode: Dynamic filters
                if (filters.reds.length > 0) {
                    const currentRed = chara.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 2);
                    const parent1Red =
                        chara.succession_chara_array[0]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 2);
                    const parent2Red =
                        chara.succession_chara_array[1]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 2);

                    const aptStars = {
                        Turf: 0,
                        Dirt: 0,
                        "Front Runner": 0,
                        "Pace Chaser": 0,
                        "Late Surger": 0,
                        "End Closer": 0,
                        Sprint: 0,
                        Mile: 0,
                        Medium: 0,
                        Long: 0,
                    };
                    [currentRed, parent1Red, parent2Red].forEach((f) => {
                        if (f && f.name in aptStars) {
                            aptStars[f.name as keyof typeof aptStars] +=
                                f.rarity;
                        }
                    });

                    for (const filter of filters.reds) {
                        const aptValue =
                            aptStars[filter.stat as keyof typeof aptStars] || 0;
                        if (aptValue < filter.min || aptValue > filter.max) {
                            isDisplayed = false;
                            break;
                        }
                    }
                }
            } else {
                // Simple Mode: Check only current unit's red factor (OR logic)
                const hasRedSelection =
                    filters.simpleReds.turf ||
                    filters.simpleReds.dirt ||
                    filters.simpleReds.frontRunner ||
                    filters.simpleReds.paceChaser ||
                    filters.simpleReds.lateSurger ||
                    filters.simpleReds.endCloser ||
                    filters.simpleReds.sprint ||
                    filters.simpleReds.mile ||
                    filters.simpleReds.medium ||
                    filters.simpleReds.long;

                if (hasRedSelection) {
                    const currentRed = chara.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 2);

                    // Show if the red factor matches ANY selected aptitude with required stars
                    const matchesAnyRed =
                        (filters.simpleReds.turf &&
                            currentRed?.name === "Turf" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.dirt &&
                            currentRed?.name === "Dirt" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.frontRunner &&
                            currentRed?.name === "Front Runner" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.paceChaser &&
                            currentRed?.name === "Pace Chaser" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.lateSurger &&
                            currentRed?.name === "Late Surger" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.endCloser &&
                            currentRed?.name === "End Closer" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.sprint &&
                            currentRed?.name === "Sprint" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.mile &&
                            currentRed?.name === "Mile" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.medium &&
                            currentRed?.name === "Medium" &&
                            currentRed.rarity >= filters.simpleReds.stars) ||
                        (filters.simpleReds.long &&
                            currentRed?.name === "Long" &&
                            currentRed.rarity >= filters.simpleReds.stars);

                    if (!matchesAnyRed) {
                        isDisplayed = false;
                    }
                }
            }

            // Total Blues filter (lineage mode only)
            if (
                filters.lineageMode &&
                (filters.totalBlues.min > 0 || filters.totalBlues.max < 9)
            ) {
                const currentBlue = chara.factor_id_array
                    .map((id) => factorsData[id])
                    .find((f) => f?.type === 1);
                const parent1Blue =
                    chara.succession_chara_array[0]?.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 1);
                const parent2Blue =
                    chara.succession_chara_array[1]?.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 1);

                const totalBlueStars =
                    (currentBlue?.rarity || 0) +
                    (parent1Blue?.rarity || 0) +
                    (parent2Blue?.rarity || 0);

                if (
                    totalBlueStars < filters.totalBlues.min ||
                    totalBlueStars > filters.totalBlues.max
                ) {
                    isDisplayed = false;
                }
            }

            // Total Reds filter (lineage mode only)
            if (
                filters.lineageMode &&
                (filters.totalReds.min > 0 || filters.totalReds.max < 9)
            ) {
                const currentRed = chara.factor_id_array
                    .map((id) => factorsData[id])
                    .find((f) => f?.type === 2);
                const parent1Red =
                    chara.succession_chara_array[0]?.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 2);
                const parent2Red =
                    chara.succession_chara_array[1]?.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 2);

                const totalRedStars =
                    (currentRed?.rarity || 0) +
                    (parent1Red?.rarity || 0) +
                    (parent2Red?.rarity || 0);

                if (
                    totalRedStars < filters.totalReds.min ||
                    totalRedStars > filters.totalReds.max
                ) {
                    isDisplayed = false;
                }
            }

            // Greens
            if (filters.greens.stars > 1) {
                const hasGreen = allFactors.some((id) => {
                    const f = factorsData[id];
                    return f?.type === 3 && f.rarity >= filters.greens.stars;
                });
                isDisplayed = isDisplayed && hasGreen;
            }

            // Whites
            const selectedWhites = Object.entries(filters.whites)
                .filter(([_, v]) => v > 0)
                .map(([k, v]) => ({ name: k, minStars: v }));
            if (selectedWhites.length > 0) {
                if (filters.whitesIncludeParents) {
                    const hasAllWhites = selectedWhites.every(
                        ({ name, minStars }) => {
                            const currentWhite = chara.factor_id_array
                                .map((id) => factorsData[id])
                                .find(
                                    (f) =>
                                        f &&
                                        (f.type === 4 ||
                                            f.type === 5 ||
                                            f.type === 6) &&
                                        f.name === name,
                                );

                            const parent1White =
                                chara.succession_chara_array[0]?.factor_id_array
                                    .map((id) => factorsData[id])
                                    .find(
                                        (f) =>
                                            f &&
                                            (f.type === 4 ||
                                                f.type === 5 ||
                                                f.type === 6) &&
                                            f.name === name,
                                    );

                            const parent2White =
                                chara.succession_chara_array[1]?.factor_id_array
                                    .map((id) => factorsData[id])
                                    .find(
                                        (f) =>
                                            f &&
                                            (f.type === 4 ||
                                                f.type === 5 ||
                                                f.type === 6) &&
                                            f.name === name,
                                    );

                            const totalStars =
                                (currentWhite?.rarity || 0) +
                                (parent1White?.rarity || 0) +
                                (parent2White?.rarity || 0);

                            return totalStars >= minStars;
                        },
                    );
                    isDisplayed = isDisplayed && hasAllWhites;
                } else {
                    const hasAllWhites = selectedWhites.every(
                        ({ name, minStars }) =>
                            allFactors.some((id) => {
                                const f = factorsData[id];
                                return (
                                    (f?.type === 4 ||
                                        f?.type === 5 ||
                                        f?.type === 6) &&
                                    f.name === name &&
                                    f.rarity >= minStars
                                );
                            }),
                    );
                    isDisplayed = isDisplayed && hasAllWhites;
                }
            }

            return isDisplayed;
        });

        return result;
    });
</script>

<div class="container-fluid">
    <!-- Top navigation bar -->
    <nav class="navbar navbar-expand-lg bg-slate mb-3">
        <div class="container-fluid">
            <!-- Left side: Title + Nav links -->
            <div class="d-flex gap-2 align-items-center">
                <span class="navbar-brand mb-0 h1">Affinity</span>

                <div class="vr mx-1"></div>

                <a class="nav-link" href="#/">Roster</a>
                <a class="nav-link active" href="#/affinity">Affinity</a>
                <a class="nav-link" href="#/planner">Planner</a>
            </div>

            <!-- Right side: Controls -->
            <div class="ms-auto d-flex align-items-center gap-2">
                {#if selectedCharaId}
                    <Filter {filters} {availableWhites} />
                {/if}

                <label for="targetCharaSelect" class="form-label mb-0 small"
                    >Target:</label
                >
                <select
                    id="targetCharaSelect"
                    class="form-select form-select-sm"
                    style="width: 200px;"
                    onchange={onCharaSelect}
                >
                    <option value="">-- Choose --</option>
                    {#each uniqueCharacters as char (char.charaId)}
                        <option value={char.charaId}>{char.charaName}</option>
                    {/each}
                </select>
            </div>
        </div>
    </nav>

    <!-- Instructions -->
    {#if !selectedCharaId}
        <div class="alert alert-info" role="alert">
            <h5 class="alert-heading">How to use the Affinity Calculator</h5>
            <p>
                Select a target uma from the dropdown above to see how well each
                uma in your roster would pair with that target as breeding
                parents. The roster will be sorted by affinity score (highest
                first).
            </p>
            <hr />
            <p class="mb-0">
                <strong>Affinity</strong> is calculated based on shared relations
                (properties like running style, mare status, etc.) and shared race
                wins between the uma, its parents, and grandparents.
            </p>
        </div>
    {:else}
        <!-- Results count and search -->
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <p class="text-muted mb-1">
                        Showing {filteredUmas.length} of {sortedUmas.length} uma(s)
                        as potential Parent 1 sorted by affinity with
                        <strong
                            >{uniqueCharacters.find(
                                (c) => c.charaId === selectedCharaId,
                            )?.charaName}</strong
                        >
                    </p>
                    <p class="text-muted text-sm mb-0">
                        <em
                            >Note: Parent 2 affinity is not calculated (Values
                            will be slightly lower than in-game)</em
                        >
                    </p>
                </div>
                <input
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Search by character name..."
                    bind:value={searchQuery}
                    style="width: 250px;"
                />
            </div>
        </div>
    {/if}

    <!-- Display sorted umas in grid -->
    {#if selectedCharaId && filteredUmas.length > 0}
        <div
            class="row row-cols-1 row-cols-lg-4 g-3 py-4"
            style="overflow: visible;"
        >
            {#each filteredUmas as item (item.uma.chara_seed)}
                <div class="col" style="overflow: visible;">
                    <div class="affinity-card-wrapper">
                        <!-- Affinity badges section -->
                        <div class="affinity-badge-section">
                            <div class="affinity-score-badge">
                                <span class="badge badge-total">
                                    Total: {item.affinity.totalAffinity}
                                </span>
                                {#if item.affinity.breakdown.p1 >= 0}
                                    <span
                                        class="badge badge-p1"
                                        title="Direct affinity between target and P1"
                                    >
                                        P1: {item.affinity.breakdown.p1}
                                    </span>
                                {/if}
                                {#if item.affinity.breakdown.p1_1 >= 0}
                                    <span
                                        class="badge badge-gp"
                                        title="Grandparent 1 contribution: aff(P1,GP1) + race(P1,GP1)"
                                    >
                                        GP1: {item.affinity.breakdown.p1_1}
                                    </span>
                                {/if}
                                {#if item.affinity.breakdown.p1_2 >= 0}
                                    <span
                                        class="badge badge-gp"
                                        title="Grandparent 2 contribution: aff(P1,GP2) + race(P1,GP2)"
                                    >
                                        GP2: {item.affinity.breakdown.p1_2}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <!-- Uma card section -->
                        <div class="uma-card-section">
                            <Chara charaData={item.uma} {display} {filters}
                            ></Chara>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else if selectedCharaId && searchQuery}
        <div class="alert alert-warning" role="alert">
            No characters found matching "{searchQuery}". Try a different search
            term.
        </div>
    {/if}
</div>

<style>
    .affinity-card-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .affinity-badge-section {
        padding: 0.5rem;
        position: relative;
        z-index: 10;
        min-height: 3rem;
        display: flex;
        align-items: center;
        border: 1px solid #64748b;
        border-radius: 0.25rem;
        margin-bottom: 0.5rem;
    }

    .uma-card-section {
        position: relative;
        z-index: 1;
    }

    .affinity-score-badge {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
    }

    .affinity-score-badge .badge {
        font-size: 0.75rem;
        padding: 0.35rem 0.6rem;
    }

    .badge-total {
        background-color: #0d6efd;
        color: #ffffff;
    }

    .badge-p1 {
        background-color: #6c757d;
        color: #ffffff;
    }

    .badge-gp {
        background-color: #0dcaf0;
        color: #000000;
    }

    .text-sm {
        font-size: 0.875rem;
    }

    .bg-slate {
        background-color: #475569 !important;
    }

    .btn-slate-light {
        background-color: #94a3b8;
        border-color: #94a3b8;
        color: #fff;
    }

    .btn-slate-light:hover {
        background-color: #64748b;
        border-color: #64748b;
    }

    .navbar-brand {
        color: white !important;
        font-weight: bold;
    }

    .nav-link {
        color: rgba(255, 255, 255, 0.8) !important;
    }

    .nav-link:hover {
        color: white !important;
    }

    .nav-link.active {
        color: white !important;
        font-weight: bold;
    }

    .vr {
        border-left: 1px solid rgba(255, 255, 255, 0.3);
        height: 1.5rem;
    }
</style>
